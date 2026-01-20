import { Queue, Worker } from 'bullmq';

import { AUCTION_SYNC_INTERVAL, AUCTION_FULL_SYNC_INTERVAL } from '../config';

import { indexAuctions, IndexAuctionsJob } from './indexAuctions';

import { REDIS_HOST, REDIS_PORT } from '@core/config';

export const MARKET_QUEUE_NAME = 'marketSync' as const;

export type MarketJobs = IndexAuctionsJob;

type QueueJobNames = MarketJobs['jobName'];
type QueueResultType = void;

let _marketQueue: null | Queue<MarketJobs, QueueResultType, QueueJobNames> = null;

export const createMarketQueue = () => {
  if (!_marketQueue) {
    _marketQueue = new Queue<MarketJobs, QueueResultType, QueueJobNames>(MARKET_QUEUE_NAME, {
      connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
      defaultJobOptions: {
        removeOnComplete: {
          age: 60 * 60, // 1 hour
        },
        removeOnFail: {
          age: 60 * 60, // 1 hour
        },
      },
    });
  }

  return _marketQueue;
};

export const startJobs = async () => {
  const marketQueue = createMarketQueue();

  const marketWorker = new Worker<MarketJobs, QueueResultType, QueueJobNames>(
    MARKET_QUEUE_NAME,
    async job => {
      console.log(`Starting job ${job.name} with id ${job.id}`);
      switch (job.data.jobName) {
        case 'indexAuctions':
          await indexAuctions(job.data.full);
          break;

        default:
          throw new Error('Unrecognised job in market queue!');
      }
    },
    {
      connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
    }
  );

  // Incremental sync (every 3 minutes by default)
  console.log(`Setting up incremental indexAuctions repeatable job with pattern: ${AUCTION_SYNC_INTERVAL}`);
  await marketQueue.add(
    'indexAuctions',
    {
      jobName: 'indexAuctions',
      full: false,
    },
    {
      repeat: {
        immediately: true,
        pattern: AUCTION_SYNC_INTERVAL,
      },
    }
  );

  // Full sync (daily at 3 AM by default)
  console.log(`Setting up full indexAuctions repeatable job with pattern: ${AUCTION_FULL_SYNC_INTERVAL}`);
  await marketQueue.add(
    'indexAuctions',
    {
      jobName: 'indexAuctions',
      full: true,
    },
    {
      repeat: {
        immediately: false,
        pattern: AUCTION_FULL_SYNC_INTERVAL,
      },
    }
  );

  console.log('Market sync jobs scheduled');

  return {
    queues: [marketQueue],
    marketWorker,
  };
};
