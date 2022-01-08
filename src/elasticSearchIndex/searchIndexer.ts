import type { MappingFieldType } from '@elastic/elasticsearch/api/types';
import pLimit from 'p-limit';

import { ELASTIC_SEARCH_INDEX_NAME, SEARCH_INDEXER_RECENT_LOGGED_IN_TIME } from '../config';
import { AccountService } from '../services/AccountService';
import { NameResolutionService } from '../services/NameResolutionService';
import { PlayerCreatureObjectService, PlayerRecord } from '../services/PlayerCreatureObjectService';
import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import TAGIFY from '../utils/tagify';

import { elasticClient } from './elastic';

interface BaseDocument {
  type: unknown;
  id: string;
  lastSeen: string;

  relevancyBump: number;
}

interface ObjectDocument extends BaseDocument {
  type: 'Object';
  ownerId?: string;

  objectName?: string;
  basicName: string;

  // Only for Character Objects
  accountName?: string;
  stationId?: string;
}

interface AccountDocument extends BaseDocument {
  type: 'Account';
  accountName?: string;
  stationId: string;
}

export type SearchDocument = AccountDocument | ObjectDocument;
type KeysOfUnion<T> = T extends T ? keyof T : never;

/**
 * Just a little helper type to make sure that we're mapping every field in our desired document layout.
 */
interface currentMappingType {
  properties: Record<KeysOfUnion<SearchDocument>, { type: MappingFieldType }>;
}

const currentMapping: currentMappingType = {
  properties: {
    type: { type: 'keyword' },
    id: { type: 'keyword' },
    lastSeen: { type: 'date' },
    ownerId: { type: 'keyword' },

    objectName: { type: 'text' },
    basicName: { type: 'text' },
    stationId: { type: 'keyword' },
    accountName: { type: 'text' },

    relevancyBump: { type: 'rank_feature' },
  },
} as const;

export async function initialSearchIndexSetup() {
  console.log(`Attempting to setup the ${ELASTIC_SEARCH_INDEX_NAME} index in Elastic`);
  const { body: indexExists } = await elasticClient.indices.exists({ index: ELASTIC_SEARCH_INDEX_NAME });

  try {
    if (indexExists) {
      await elasticClient.indices.putMapping({
        index: ELASTIC_SEARCH_INDEX_NAME,
        body: currentMapping,
      });
    } else {
      await elasticClient.indices.create({
        index: ELASTIC_SEARCH_INDEX_NAME,
        body: {
          mappings: currentMapping,
        },
      });
    }
  } catch (e) {
    console.error(e);
  }
}

export async function indexRecentLogins() {
  console.time('Producing docs');

  console.log('Finding recently logged in characters');
  console.time('Finding recently logged in characters');
  const characters = await playerCreatureService.getRecentlyLoggedInCharacters(SEARCH_INDEXER_RECENT_LOGGED_IN_TIME);
  console.timeEnd('Finding recently logged in characters');

  console.log(`Producing documents for ${characters.length} characters`);
  const limit = pLimit(10);

  const documentPromises = characters.map(character =>
    limit(async () => {
      const slug = `Processing OID ${character.CHARACTER_OBJECT}`;
      console.time(slug);
      const documentsToCommit = await produceDocumentsRelatedToPlayer(character);
      console.log(
        `Processing OID ${character.CHARACTER_OBJECT} resulted in ${documentsToCommit.length} documents being produced`
      );

      if (documentsToCommit.length > 0) {
        const body = documentsToCommit.flatMap(doc => [
          { index: { _index: ELASTIC_SEARCH_INDEX_NAME, _id: `${doc.type}:${doc.id}` } },
          doc,
        ]);

        await elasticClient.bulk({ body });
      }

      console.timeEnd(slug);
    })
  );

  await Promise.all(documentPromises);

  console.timeEnd('Producing docs');
}

const objectService = new ServerObjectService();
const stringFileService = new StringFileLoader();
const nameResolutionService = new NameResolutionService();
const playerCreatureService = new PlayerCreatureObjectService();
const accountService = new AccountService();

async function produceDocumentsForPlayerContents(character: PlayerRecord): Promise<Promise<SearchDocument>[]> {
  // We're going to recursively get the object, and anything that loads with it.
  // This probably won't include stuff that's in demand-loaded containers, like the bank,
  // so it may be worth adding those manually at some point.
  const objects = await objectService.getMany({
    loadsWith: character.CHARACTER_OBJECT,
    excludeDeleted: true,
    limit: 10000,
  });

  if (objects.length > 0) {
    const documentPromises: Promise<ObjectDocument>[] = objects.map(async object => {
      const document: ObjectDocument = {
        type: 'Object',
        id: object.id,
        objectName: await nameResolutionService.resolveName(object, {
          resolveCustomNames: true,
          stringFileService,
        }),
        basicName: await nameResolutionService.resolveName(object, {
          resolveCustomNames: false,
          stringFileService,
        }),
        lastSeen: new Date().toISOString(),
        relevancyBump: object.typeId === TAGIFY('CREO') ? 10 : 0,
      };

      return document;
    });

    return documentPromises;
  }

  return [];
}

async function produceAccountDocumentForPlayer(character: PlayerRecord): Promise<SearchDocument[]> {
  if (!character || !character.STATION_ID) {
    return [];
  }

  const [accountName] = await Promise.all([accountService.getAccountNameFromStationId(character.STATION_ID)]);

  const document: AccountDocument = {
    type: 'Account',
    id: character.STATION_ID.toString(),
    stationId: character.STATION_ID.toString(),
    lastSeen: new Date().toISOString(),
    relevancyBump: 30,
    accountName: accountName ?? '',
  };

  return [document];
}

export async function produceDocumentsRelatedToPlayer(character: PlayerRecord): Promise<SearchDocument[]> {
  const fetchers = await Promise.all([
    produceDocumentsForPlayerContents(character),
    produceAccountDocumentForPlayer(character),
  ]);

  const documents = await Promise.all(fetchers.flat());

  // If the initial object was a PC creature, we're also going to find all their strucutures and add them to the processing queue.

  return documents;
}
