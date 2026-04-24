import { Job } from 'bullmq';
import { isPresent } from '@core/utils/utility-types';
import { createJobTimer } from '@core/utils/jobTimer';

import { saveDocuments } from '../utils/saveDocuments';
import { AccountDocument, ObjectDocument, SearchDocument } from '../types';
import gqlSdk from '../gqlSdk';
import { stripUGCModifiers } from '../utils/stripUgcModifiers';

import { createGalaxySearchQueue, GalaxySearchJobs } from '.';

export interface IndexObjectJob {
  jobName: 'indexObject';
  objectId: string;
}

const RECURSIVE_INDEX_TEMPLATES = new Set(['object/tangible/bank/character_bank.iff']);

export async function indexObject(job: Job<GalaxySearchJobs>) {
  if (job.data.jobName !== 'indexObject') throw new Error('Job was passed to incorrect handler!');

  const log = job.log.bind(job);
  const timer = createJobTimer(log);
  const { objectId } = job.data;

  await log(`Indexing object ${objectId}`);

  const getObjectDetailResult = await timer.time('fetchObjectDetails', () =>
    gqlSdk.getLoadingWithObjectDetails({
      excludeDeleted: true,
      limit: 10000,
      rootId: objectId,
    })
  );

  const rootResults = getObjectDetailResult.root ?? [];
  const contentResults = getObjectDetailResult.contents ?? [];
  const objects = [...rootResults, ...contentResults];
  const queue = createGalaxySearchQueue();

  await log(`Fetched ${rootResults.length} root + ${contentResults.length} contained objects`);

  if (objects.length === 0) {
    await log(`No objects returned for ${objectId} — nothing to index`);
    return;
  }

  const documents: SearchDocument[] = [];
  let accountDocs = 0;
  let structuresEnqueued = 0;
  let recursiveTemplatesEnqueued = 0;

  const endProcess = timer.start('processObjects');
  for (const object of objects) {
    if (object.__typename === 'PlayerCreatureObject') {
      if (object.account) {
        const accountDoc: AccountDocument = {
          type: 'Account',
          id: object.account.id,
          stationId: [parseInt(object.account.id) << 32, parseInt(object.account.id) >>> 0].map(String),
          lastSeen: new Date().toISOString(),
          accountName: object.account.accountName ?? '',
          characterIds: object.account.characters?.map(c => c.id).filter(isPresent) ?? [],
          characters: object.account.characters?.map(c => c.name).filter(isPresent) ?? [],
        };
        documents.push(accountDoc);
        accountDocs += 1;
      }

      if (object.structures && object.structures.length > 0) {
        await queue.addBulk(
          object.structures.map(struct => ({
            name: 'indexObject',
            data: { jobName: 'indexObject', objectId: struct.id },
            opts: {
              jobId: `indexObject-${struct.id}`,
              removeOnComplete: {
                // Reindex structures once every hour
                age: 60 * 60,
              },
            },
          }))
        );
        structuresEnqueued += object.structures.length;
      }
    }

    if (object.template && RECURSIVE_INDEX_TEMPLATES.has(object.template)) {
      await queue.addBulk([
        {
          name: 'indexObject',
          data: { jobName: 'indexObject', objectId: object.id },
          opts: {
            jobId: `indexObject-${object.id}`,
          },
        },
      ]);
      recursiveTemplatesEnqueued += 1;
    }

    const location =
      'worldspaceLocation' in object && object.worldspaceLocation ? object.worldspaceLocation : object.location;

    const objectDoc: ObjectDocument = {
      type: 'Object',
      lastSeen: new Date().toISOString(),
      id: object.id,
      objectName: stripUGCModifiers(object.resolvedName),
      basicName: object.basicName,

      template: object.template ?? undefined,
      templateId: object.templateId.toString(),

      location: {
        scene: object.scene,
        x: location?.[0] ?? 0,
        y: location?.[1] ?? 0,
        z: location?.[2] ?? 0,
      },

      ...('shipPartSummary' in object &&
        object.shipPartSummary && {
          shipPart: {
            headlinePercentile: object.shipPartSummary.headlinePercentile,
            reverseEngineeringLevel: object.shipPartSummary.reverseEngineeringLevel,
          },
        }),

      ...(object.deletionReason &&
        object.deletionDate && {
          deletionReason: object.deletionReason,
          deletionDate: object.deletionDate,
        }),

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
    documents.push(objectDoc);
  }

  await endProcess();

  await timer.time('saveDocuments', async () => {
    const documentSaves = saveDocuments(documents);
    await Promise.all(documentSaves);
  });

  await log(
    `Saved ${documents.length} documents for ${objectId} ` +
      `(${accountDocs} account, ${structuresEnqueued} structure reindexes enqueued, ` +
      `${recursiveTemplatesEnqueued} recursive-template reindexes enqueued)`
  );
  await timer.total();
}
