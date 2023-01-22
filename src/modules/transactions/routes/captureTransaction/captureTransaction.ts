import { z } from 'zod';
import { Router } from 'express';
import { elasticClient } from '@core/utils/elasticClient';

import { ELASTIC_SEARCH_TRANSACTION_INDEX_NAME } from '../../config';

import { convertTransactionLogToTransaction } from './convertTransaction';

const router = Router();

const transactionLogSchema = z.object({
  /* eslint-disable camelcase */
  '@timestamp': z.string(),
  transaction_type: z.enum(['Auction', 'Trade', 'PickupTrade', 'DropTrade', 'Tip', 'OwnershipTransfer']),
  transaction_party_a_oid: z.string(),
  transaction_party_a_credits: z.string(),
  transaction_party_a_items: z.array(z.string()).default([]),
  transaction_party_b_oid: z.string(),
  transaction_party_b_credits: z.string(),
  transaction_party_b_items: z.array(z.string()).default([]),
  /* eslint-enable camelcase */
});

export type TransactionLog = z.infer<typeof transactionLogSchema>;

router.post('/capture_transaction', async (req, res) => {
  const transactionLog = transactionLogSchema.parse(req.body);

  try {
    const transaction = await convertTransactionLogToTransaction(transactionLog);
    await elasticClient.index({
      index: ELASTIC_SEARCH_TRANSACTION_INDEX_NAME,
      document: transaction,
    });
    console.log(`Processed transaction and saved with id ${transaction.id}`);
  } catch (err) {
    console.error(`Transaction failed to process and was skipped`, err, transactionLog);
  }

  res.status(201).send();
});

export default router;
