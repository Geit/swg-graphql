import DataLoader from 'dataloader';

import { ELASTIC_SEARCH_INDEX_NAME } from '../../config';
import { SearchDocument } from '../types';

import { elasticClient } from './elasticClient';

const elasticDocumentSaver = new DataLoader(_saveDocuments);

interface IndexOpReturnType {
  _index: string;
  _id: string;
  _version: number;
  result: 'updated' | 'created';
  _shards: unknown;
  _seq_no: number;
  _primary_term: number;
  status: number;
}

async function _saveDocuments(documents: readonly SearchDocument[]) {
  const body = documents.flatMap(doc => [
    { index: { _index: ELASTIC_SEARCH_INDEX_NAME, _id: `${doc.type}:${doc.id}` } },
    doc,
  ]);

  const results = await elasticClient.bulk({ body });

  if (results.errors) {
    console.log('Errors while storing search indexed characters');
  }

  return results.items.map(i => i.index);
}

export const saveDocument = (doc: SearchDocument) => elasticDocumentSaver.load(doc);
export const saveDocuments = (docs: SearchDocument[]) => docs.map(doc => elasticDocumentSaver.load(doc));
