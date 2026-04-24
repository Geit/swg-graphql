import DataLoader from 'dataloader';
import { elasticClient } from '@core/utils/elasticClient';

import { GALAXY_SEARCH_INDEX_NAME } from '../config';
import { SearchDocument } from '../types';

const elasticDocumentSaver = new DataLoader(_saveDocuments, { cache: false });

async function _saveDocuments(documents: readonly SearchDocument[]) {
  const body = documents.flatMap(doc => [
    { index: { _index: GALAXY_SEARCH_INDEX_NAME, _id: `${doc.type}:${doc.id}` } },
    doc,
  ]);

  const results = await elasticClient.bulk({ body });

  if (results.errors) {
    const failures = results.items
      .map((item, idx) => ({ item: item.index, doc: documents[idx] }))
      .filter(({ item }) => item?.error);
    const sample = failures
      .slice(0, 3)
      .map(({ item, doc }) => `${doc.type}:${doc.id} ${item?.error?.type}: ${item?.error?.reason}`)
      .join('; ');
    throw new Error(`Elasticsearch bulk index failed for ${failures.length}/${documents.length} documents. ${sample}`);
  }

  return results.items.map(i => i.index);
}

export const saveDocument = (doc: SearchDocument) => elasticDocumentSaver.load(doc);
export const saveDocuments = (docs: SearchDocument[]) => docs.map(doc => elasticDocumentSaver.load(doc));
