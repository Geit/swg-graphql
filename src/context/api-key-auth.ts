import path from 'path';
import { readFileSync } from 'fs';

import { GraphQLError } from 'graphql';

import { DISABLE_AUTH } from '../config';

import { SWGGraphqlContextFunction } from './types';

interface ApiKeysDocument {
  enabled: boolean;
}

const serverConfigFile = path.join(__dirname, '../../data/api-keys.json');
const apiKeys: Record<string, ApiKeysDocument | undefined> = JSON.parse(
  readFileSync(serverConfigFile, { encoding: 'ascii' })
);

// eslint-disable-next-line require-await
export const apiKeyAuth: SWGGraphqlContextFunction = async params => {
  if (DISABLE_AUTH) {
    return {};
  }

  if (!params.req.headers.authorization) {
    throw new GraphQLError('Authorization required.', {
      extensions: {
        code: 'FORBIDDEN',
        myExtension: 'swg-graphql',
      },
    });
  }

  const apiKey = apiKeys[params.req.headers.authorization.replace('ApiKey-', '')];

  if (!apiKey || !apiKey.enabled) {
    throw new GraphQLError('Invalid API Key', {
      extensions: {
        code: 'FORBIDDEN',
        myExtension: 'swg-graphql',
      },
    });
  }

  return {};
};
