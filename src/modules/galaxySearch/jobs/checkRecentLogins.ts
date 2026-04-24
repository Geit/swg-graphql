import { Job } from 'bullmq';
import { createJobTimer } from '@core/utils/jobTimer';

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

  const log = job.log.bind(job);
  const timer = createJobTimer(log);
  const { limit = 1000, offset = 0, loginsWithLastSecs } = job.data;

  await log(`Checking recent logins within last ${loginsWithLastSecs}s (limit=${limit}, offset=${offset})`);

  const getRecentLoginResult = await timer.time('fetchRecentLogins', () =>
    gqlSdk.getRecentLogins({
      durationSeconds: loginsWithLastSecs,
      limit,
      offset,
    })
  );

  const characters = getRecentLoginResult.recentLogins.results;
  const totalResults = getRecentLoginResult.recentLogins.totalResults;
  const queue = createGalaxySearchQueue();

  await log(`Found ${characters.length} recent logins (total available: ${totalResults})`);

  if (totalResults > limit && offset === 0) {
    // There's more recent logins that will need to be turned into indexing jobs.
    // We schedule more recent login fetches here to retrieve them.
    const paginationJobs = Math.ceil(totalResults / limit) - 1;
    await log(`Scheduling ${paginationJobs} paginated follow-up checkRecentLogins jobs`);
    await timer.time('enqueuePagination', () =>
      queue.addBulk(
        Array(paginationJobs)
          .fill(true)
          .map((_, idx) => ({
            name: 'checkRecentLogins',
            data: { jobName: 'checkRecentLogins', loginsWithLastSecs, limit, offset: (idx + 1) * limit },
          }))
      )
    );
  }

  const characterIds = new Set<string>();
  for (const character of characters) {
    characterIds.add(character.id);
    for (const accountCharacter of character.account?.characters ?? []) {
      characterIds.add(accountCharacter.id);
    }
  }

  await timer.time('enqueueIndexObjects', () =>
    queue.addBulk(
      Array.from(characterIds).map(id => ({
        name: 'indexObject',
        data: { jobName: 'indexObject', objectId: id },
        opts: { jobId: `indexObject-${id}` },
      }))
    )
  );

  await log(
    `Enqueued indexObject for ${characterIds.size} unique characters ` +
      `(expanded from ${characters.length} logins via account siblings)`
  );
  await timer.total();
}
