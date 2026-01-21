import DataLoader from 'dataloader';

import { MARKET_INDEX_NAME } from '../config';
import { MarketListingDocument } from '../types';

import { elasticClient } from '@core/utils/elasticClient';

const elasticDocumentSaver = new DataLoader(_saveDocuments, { cache: false });

async function _saveDocuments(documents: readonly MarketListingDocument[]) {
  const body = documents.flatMap(doc => [{ index: { _index: MARKET_INDEX_NAME, _id: `${doc.type}:${doc.id}` } }, doc]);

  const results = await elasticClient.bulk({ body, refresh: false });

  if (results.errors) {
    console.log('Errors while storing market listing documents');
    for (const item of results.items) {
      if (item.index?.error) {
        console.error(`Error indexing document ${item.index._id}:`, item.index.error);
      }
    }
  }

  return results.items.map(i => i.index);
}

export const saveDocument = (doc: MarketListingDocument) => elasticDocumentSaver.load(doc);
export const saveDocuments = (docs: MarketListingDocument[]) => docs.map(doc => elasticDocumentSaver.load(doc));
