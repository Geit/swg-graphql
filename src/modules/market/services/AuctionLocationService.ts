import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from '@core/services/db';

/**
 * Raw record from AUCTION_LOCATIONS table.
 */
interface AuctionLocationRecord {
  LOCATION_ID: number;
  OWNER_ID: number | null;
  LOCATION_NAME: string | null;
  SALES_TAX: number | null;
  SALES_TAX_BANK_ID: number | null;
  EMPTY_DATE: number;
  LAST_ACCESS_DATE: number;
  INACTIVE_DATE: number;
  STATUS: number;
  SEARCH_ENABLED: string | null;
  ENTRANCE_CHARGE: number;
}

/**
 * Transformed auction location data.
 */
export interface AuctionLocation {
  id: string;
  ownerId: string | null;
  locationName: string | null;
  salesTax: number | null;
  salesTaxBankId: string | null;
  emptyDate: number;
  lastAccessDate: number;
  inactiveDate: number;
  status: number;
  searchEnabled: boolean;
  entranceCharge: number;
  /** Planet extracted from locationName (planet.region.vendorName) */
  planet: string | null;
  /** Region extracted from locationName */
  region: string | null;
  /** Vendor name extracted from locationName */
  vendorName: string | null;
}

@Service()
export class AuctionLocationService {
  private db = knexDb;

  /**
   * DataLoader with caching since locations change infrequently.
   */
  private dataloader = new DataLoader(AuctionLocationService.batchFunction, {
    cache: true,
    maxBatchSize: 999,
  });

  getOne = this.dataloader.load.bind(this.dataloader);

  /**
   * Clears the DataLoader cache for a specific location or all locations.
   */
  clearCache(locationId?: string) {
    if (locationId) {
      this.dataloader.clear(locationId);
    } else {
      this.dataloader.clearAll();
    }
  }

  static async batchFunction(keys: readonly string[]): Promise<(AuctionLocation | null)[]> {
    const results = await knexDb.select().from<AuctionLocationRecord>('AUCTION_LOCATIONS').whereIn('LOCATION_ID', keys);

    return keys.map(key => {
      const found = results.find(r => String(r.LOCATION_ID) === key);
      return found ? AuctionLocationService.convertRecord(found) : null;
    });
  }

  private static convertRecord(record: AuctionLocationRecord): AuctionLocation {
    // Parse LOCATION_NAME format: "planet.region.vendorName"
    const parts = record.LOCATION_NAME?.split('.') ?? [];
    const planet = parts[0] ?? null;
    const region = parts[1] ?? null;
    const vendorName = parts.length > 2 ? parts.slice(2).join('.') : null;

    return {
      id: String(record.LOCATION_ID),
      ownerId: record.OWNER_ID ? String(record.OWNER_ID) : null,
      locationName: record.LOCATION_NAME,
      salesTax: record.SALES_TAX,
      salesTaxBankId: record.SALES_TAX_BANK_ID ? String(record.SALES_TAX_BANK_ID) : null,
      emptyDate: record.EMPTY_DATE,
      lastAccessDate: record.LAST_ACCESS_DATE,
      inactiveDate: record.INACTIVE_DATE,
      status: record.STATUS,
      searchEnabled: record.SEARCH_ENABLED === 'Y',
      entranceCharge: record.ENTRANCE_CHARGE,
      planet,
      region,
      vendorName,
    };
  }
}
