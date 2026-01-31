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
    // eslint-disable-next-line camelcase
    wait_for_completion: false,
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

  const taskId = result.task;

  if (!taskId) {
    await log('No task ID returned - deleteByQuery may have completed synchronously');
    return;
  }

  await log(`Started prune task: ${taskId}`);

  // Poll task status until complete
  const POLL_INTERVAL_MS = 10_000;
  let completed = false;

  while (!completed) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    // eslint-disable-next-line camelcase
    const taskResponse = await elasticClient.tasks.get({ task_id: String(taskId) });
    const task = taskResponse.task;
    const status = task.status;

    if (status) {
      const progress = status.total ? Math.round(((status.deleted ?? 0) / status.total) * 100) : 0;
      await log(`Progress: ${status.deleted ?? 0}/${status.total ?? '?'} (${progress}%) deleted`);
    }

    if (taskResponse.completed) {
      completed = true;
      const response = taskResponse.response as {
        deleted?: number;
        version_conflicts?: number;
      };
      await log(
        `Prune complete: ${response?.deleted ?? 0} deleted, ${response?.version_conflicts ?? 0} conflicts skipped`
      );
    }
  }
}
