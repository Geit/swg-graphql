import path from 'path';
import { readFileSync } from 'fs';

import { AuthenticationError } from 'apollo-server-express';
import type { ContextFunction } from 'apollo-server-core';

import { DISABLE_AUTH } from '../config';

interface ApiKeysDocument {
  enabled: boolean;
}

const serverConfigFile = path.join(__dirname, '../../data/api-keys.json');
const apiKeys: Record<string, ApiKeysDocument | undefined> = JSON.parse(
  readFileSync(serverConfigFile, { encoding: 'ascii' })
);

export const apiKeyAuth: ContextFunction = params => {
  if (DISABLE_AUTH) {
    return {};
  }

  if (!params.req.headers.authorization) {
    throw new AuthenticationError('Authorization required.');
  }

  const apiKey = apiKeys[params.req.headers.authorization.replace('ApiKey-', '')];

  if (!apiKey || !apiKey.enabled) {
    throw new AuthenticationError('Invalid API Key');
  }

  return {};
};
