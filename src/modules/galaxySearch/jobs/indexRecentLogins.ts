import pLimit from 'p-limit';

import { saveDocuments } from '../utils/saveDocuments';
import { AccountDocument, ObjectDocument, SearchDocument } from '../types';
import { SEARCH_INDEXER_RECENT_LOGGED_IN_TIME } from '../../../config';
import gqlSdk, { GetRecentLoginsQuery } from '../gqlSdk';
import { isPresent } from '../../../utils/utility-types';

type RecentLoginResultType = GetRecentLoginsQuery['recentLogins'][number];

export async function indexRecentLogins() {
  console.log('Finding recently logged in characters');
  console.time('Finding recently logged in characters');

  const getRecentLoginResult = await gqlSdk.getRecentLogins({ durationSeconds: SEARCH_INDEXER_RECENT_LOGGED_IN_TIME });

  const characters = getRecentLoginResult.recentLogins;

  console.timeEnd('Finding recently logged in characters');
  console.time('Producing docs');

  console.log(`Producing documents for ${characters.length} characters`);
  const limit = pLimit(10);

  const documentPromises = characters.map(character =>
    limit(async () => {
      const slug = `Processing OID ${character.id}`;
      console.time(slug);
      const documentsToCommit = await produceDocumentsRelatedToPlayer(character);
      console.log(`Processing OID ${character.id} resulted in ${documentsToCommit.length} documents being produced`);

      if (documentsToCommit.length > 0) {
        const documentSaves = saveDocuments(documentsToCommit);
        await Promise.all(documentSaves);
      }

      console.timeEnd(slug);
    })
  );

  await Promise.all(documentPromises);

  console.timeEnd('Producing docs');
}

async function produceDocumentsForPlayerContents(character: RecentLoginResultType): Promise<SearchDocument[]> {
  // We're going to recursively get the object, and anything that loads with it.
  // This probably won't include stuff that's in demand-loaded containers, like the bank,
  // so it may be worth adding those manually at some point.
  const getObjectDetailResult = await gqlSdk.getLoadingWithObjectDetails({
    excludeDeleted: true,
    limit: 10000,
    loadWithIds: [character.id],
  });

  const objects = getObjectDetailResult.objects;

  if (!objects) return [];

  if (objects.length > 0) {
    const documents: ObjectDocument[] = objects.map(object => {
      const document: ObjectDocument = {
        type: 'Object',
        lastSeen: new Date().toISOString(),
        id: object.id,
        objectName: object.resolvedName,
        basicName: object.basicName,

        template: object.template ?? undefined,
        templateId: object.templateId.toString(),

        location: {
          scene: object.scene,
          x: object.location?.[0] ?? 0,
          y: object.location?.[1] ?? 0,
          z: object.location?.[2] ?? 0,
        },

        ...('count' in object && { count: object.count ?? 0 }),
        ...('owner' in object &&
          object.owner && {
            ownerId: object.owner.id,
            ...('account' in object.owner && {
              ownerStationId: object.owner.account?.id,
              ownerAccountName: object.owner.account?.accountName ?? undefined,
            }),
          }),
      };
      return document;
    });

    return documents;
  }

  return [];
}

function produceAccountDocumentForPlayer(character: RecentLoginResultType): SearchDocument[] {
  if (!character || !character.account) {
    return [];
  }

  const document: AccountDocument = {
    type: 'Account',
    id: character.account.id,
    stationId: character.account.id,
    lastSeen: new Date().toISOString(),
    relevancyBump: 30,
    accountName: character.account.accountName ?? '',
    characterIds: character.account.characters?.map(c => c.id).filter(isPresent) ?? [],
    characters: character.account.characters?.map(c => c.name).filter(isPresent) ?? [],
  };

  return [document];
}

export async function produceDocumentsRelatedToPlayer(character: RecentLoginResultType): Promise<SearchDocument[]> {
  const fetchers = await Promise.all([
    produceDocumentsForPlayerContents(character),
    produceAccountDocumentForPlayer(character),
  ]);

  const documents = await Promise.all(fetchers.flat());

  // If the initial object was a PC creature, we're also going to find all their strucutures and add them to the processing queue.

  return documents;
}
