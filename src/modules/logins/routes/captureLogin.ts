import { z } from 'zod';
import axios from 'axios';
import LRU from 'lru-cache';
import { elasticClient } from '@core/utils/elasticClient';
import { Router } from 'express';

import { ELASTIC_SEARCH_LOGIN_INDEX_NAME, VPN_API_CACHE_TIME, VPN_API_KEY } from '../config';

const router = Router();

const loginLogSchema = z.object({
  /* eslint-disable camelcase */
  '@timestamp': z.string(),
  station_id: z.string(),
  ip_address: z.string(),
  account_name: z.string(),
  /* eslint-enable camelcase */
});

const cachedIPLookup = new LRU<string, IPInfoAPIResponse>({
  max: 10000,
  ttl: VPN_API_CACHE_TIME,
  async fetchMethod(ipAddress) {
    const res = await axios.get<IPInfoAPIResponse>(`https://vpnapi.io/api/${ipAddress}?key=${VPN_API_KEY}`);

    return res.data;
  },
});

interface IPInfoAPIResponse {
  ip: string;
  security: { vpn: boolean; proxy: boolean; tor: boolean; relay: boolean };
  location: {
    city: string;
    region: string;
    country: string;
    continent: string;
    region_code: string;
    country_code: string;
    continent_code: string;
    latitude: string;
    longitude: string;
    time_zone: string;
    locale_code: string;
    metro_code: string;
    is_in_european_union: boolean;
  };
  network: {
    network: string;
    autonomous_system_number: string;
    autonomous_system_organization: string;
  };
}
const int32UnsignedToSigned = (uint32: number) => Int32Array.from(Uint32Array.of(uint32))[0];

router.post('/capture_login', async (req, res) => {
  const loginLog = loginLogSchema.parse(req.body);

  try {
    const ipData = await cachedIPLookup.fetch(loginLog.ip_address);

    if (!ipData) throw new Error('Could not fetch IP info for login');

    const stationId = int32UnsignedToSigned(parseInt(loginLog.station_id));
    const coords = {
      lat: ipData.location.latitude,
      lon: ipData.location.longitude,
    };

    const isProxy = ipData.security.vpn || ipData.security.relay || ipData.security.tor || ipData.security.proxy;
    const message = `User ${loginLog.account_name} logged in from IP ${ipData.ip} located in ${ipData.location.city}, ${
      ipData.location.country
    }. Is Proxy? ${isProxy ? 'Yes' : 'No'}`;

    const document = {
      '@timestamp': loginLog['@timestamp'],
      category: 'EnhancedLoginLogs',
      message,
      stationId,
      accountName: loginLog.account_name,
      ipData: {
        ...ipData,
        location: {
          ...ipData.location,
          coords,
        },
      },
    };

    await elasticClient.index({
      index: ELASTIC_SEARCH_LOGIN_INDEX_NAME,
      document,
    });
    console.log(`Captured Login: ${message}`);
  } catch (err) {
    console.error(`Login failed to process and was skipped`, err, loginLog);
  }

  res.status(201).send();
});

export const captureLogin = router;
