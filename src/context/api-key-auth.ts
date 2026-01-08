import path from 'path';
import { readFileSync } from 'fs';

import { SWGGraphqlContextFunction } from './types';

interface ApiKeysDocument {
  enabled: boolean;
  roles: string[];
}

const serverConfigFile = path.join(__dirname, '../../data/api-keys.json');
const apiKeys: Record<string, ApiKeysDocument | undefined> = JSON.parse(
  readFileSync(serverConfigFile, { encoding: 'ascii' })
);

// eslint-disable-next-line require-await
export const apiKeyAuth: SWGGraphqlContextFunction = async params => {
  if (!params.req.headers.authorization) {
    return {
      isAuthenticated: false,
    };
  }

  const apiKey = apiKeys[params.req.headers.authorization.replace('ApiKey-', '')];

  if (!apiKey || !apiKey.enabled) {
    return {
      isAuthenticated: false,
    };
  }

  return {
    roles: new Set(apiKey.roles),
    isAuthenticated: true,
  };
};
