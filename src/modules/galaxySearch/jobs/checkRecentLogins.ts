import { Job } from 'bullmq';

import gqlSdk from '../gqlSdk';

import { createGalaxySearchQueue, GalaxySearchJobs } from '.';

export interface CheckRecentLoginsJob {
  jobName: 'checkRecentLogins';
  loginsWithLastSecs: number;
  offset?: number;
  limit?: number;
}

export async function checkRecentLogins(job: Job<GalaxySearchJobs>) {
  if (job.data.jobName !== 'checkRecentLogins') throw new Error('Job was passed to incorrect handler!');

  const { limit = 1000, offset = 0, loginsWithLastSecs } = job.data;

  const getRecentLoginResult = await gqlSdk.getRecentLogins({
    durationSeconds: loginsWithLastSecs,
    limit,
    offset,
  });

  const characters = getRecentLoginResult.recentLogins.results;
  const totalResults = getRecentLoginResult.recentLogins.totalResults;
  const queue = createGalaxySearchQueue();

  if (totalResults > limit && offset === 0) {
    // There's more recent logins that will need to be turned into indexing jobs.
    // We schedule more recent login fetches here to retrieve them.
    await queue.addBulk(
      Array(Math.ceil(totalResults / limit) - 1)
        .fill(true)
        .map((_, idx) => ({
          name: 'checkRecentLogins',
          data: { jobName: 'checkRecentLogins', loginsWithLastSecs, limit, offset: (idx + 1) * limit },
        }))
    );
  }

  await queue.addBulk(
    characters.map(c => ({
      name: 'indexObject',
      data: { jobName: 'indexObject', objectId: c.id },
      opts: { jobId: `indexObject-${c.id}` },
    }))
  );
}
