import { Queue, Worker } from 'bullmq';
import { REDIS_HOST, REDIS_PORT } from '@core/config';

import { SEARCH_INDEXER_RECENT_LOGGED_IN_TIME } from '../config';

import { checkRecentLogins, CheckRecentLoginsJob } from './checkRecentLogins';
import { indexObject, IndexObjectJob } from './indexObject';
import { indexResources, IndexResourcesJob } from './indexResources';

export const GALAXY_SEARCH_QUEUE_NAME = 'galaxySearch' as const;

export type GalaxySearchJobs = CheckRecentLoginsJob | IndexObjectJob | IndexResourcesJob;

type QueueJobNames = GalaxySearchJobs['jobName'];

type QueueResultType = void;

let _galaxySearchQueue: null | Queue<GalaxySearchJobs, QueueResultType, QueueJobNames> = null;

export const createGalaxySearchQueue = () => {
  if (!_galaxySearchQueue)
    _galaxySearchQueue = new Queue<GalaxySearchJobs, QueueResultType, QueueJobNames>(GALAXY_SEARCH_QUEUE_NAME, {
      connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
      defaultJobOptions: {
        removeOnComplete: {
          age: 60 * 60,
        },
        removeOnFail: {
          age: 60 * 60,
        },
      },
    });

  return _galaxySearchQueue;
};

export const startJobs = async () => {
  const galaxySearchQueue = createGalaxySearchQueue();

  const galaxySearchWorker = new Worker<GalaxySearchJobs, QueueResultType, QueueJobNames>(
    GALAXY_SEARCH_QUEUE_NAME,
    async job => {
      const log = job.log.bind(job);
      await log(`Starting job ${job.name} with id ${job.id}`);
      switch (job.data.jobName) {
        case 'checkRecentLogins':
          await checkRecentLogins(job);
          break;

        case 'indexObject':
          await indexObject(job);
          break;

        case 'indexResources':
          await indexResources(log, job.data.full);
          break;

        default:
          throw new Error('Unrecognised job in queue!');
      }
    },
    {
      connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
    }
  );

  // const jobs = await galaxySearchQueue.getRepeatableJobs();
  // for (const job of jobs) {
  //   console.log(`Deleting repeatable job with key ${job.key}. Job name is ${job.name}`);
  //   await galaxySearchQueue.removeRepeatableByKey(job.key);
  // }

  console.log(`Setting up checkRecentLogins repeatable job`);
  await galaxySearchQueue.add(
    'checkRecentLogins',
    {
      jobName: 'checkRecentLogins',
      loginsWithLastSecs: SEARCH_INDEXER_RECENT_LOGGED_IN_TIME,
    },
    {
      repeat: {
        pattern: '*/10 * * * *',
      },
    }
  );

  await galaxySearchQueue.add('checkRecentLogins', {
    jobName: 'checkRecentLogins',
    loginsWithLastSecs: SEARCH_INDEXER_RECENT_LOGGED_IN_TIME,
  });

  console.log(`Setting up indexResources repeatable job`);
  await galaxySearchQueue.add(
    'indexResources',
    {
      jobName: 'indexResources',
      full: false,
    },
    {
      repeat: {
        pattern: '*/10 * * * *',
      },
    }
  );

  await galaxySearchQueue.add(
    'indexResources',
    {
      jobName: 'indexResources',
      full: true,
    },
    {
      repeat: {
        pattern: '0 7 * * *',
      },
    }
  );
  console.log(`Repeatable jobs scheduled.`);

  return {
    queues: [galaxySearchQueue],
    galaxySearchWorker,
  };
};
