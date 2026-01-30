import { Job } from 'bullmq';
import { elasticClient } from '@core/utils/elasticClient';

import { GALAXY_SEARCH_INDEX_NAME, STALE_DOCUMENT_THRESHOLD_DAYS } from '../config';

import { GalaxySearchJobs } from '.';

export interface PruneStaleDocumentsJob {
  jobName: 'pruneStaleDocuments';
  thresholdDays?: number;
}

export async function pruneStaleDocuments(job: Job<GalaxySearchJobs>) {
  if (job.data.jobName !== 'pruneStaleDocuments') throw new Error('Job was passed to incorrect handler!');

  const log = job.log.bind(job);
  const thresholdDays = job.data.thresholdDays ?? STALE_DOCUMENT_THRESHOLD_DAYS;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);
  const cutoffDateString = cutoffDate.toISOString();

  await log(`Pruning documents not seen since ${cutoffDateString} (${thresholdDays} days ago)`);

  const result = await elasticClient.deleteByQuery({
    index: GALAXY_SEARCH_INDEX_NAME,
    conflicts: 'proceed',
    query: {
      bool: {
        must: [
          {
            range: {
              lastSeen: {
                lt: cutoffDateString,
              },
            },
          },
        ],
        // eslint-disable-next-line camelcase
        must_not: [
          {
            term: {
              type: 'Account',
            },
          },
        ],
      },
    },
  });

  await log(
    `Pruned ${result.deleted ?? 0} stale documents from the search index (${result.version_conflicts ?? 0} conflicts skipped)`
  );
}
