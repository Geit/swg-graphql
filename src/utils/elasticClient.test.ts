import { describe, it, expect } from 'vitest';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

import { transformElasticResponse } from './elasticClient';

describe('transformElasticResponse', () => {
  it('should transform response with object total', () => {
    const mockResponse: SearchResponse<{ name: string }> = {
      took: 1,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 2, relation: 'eq' },
        hits: [
          { _index: 'test', _id: '1', _source: { name: 'Item 1' } },
          { _index: 'test', _id: '2', _source: { name: 'Item 2' } },
        ],
      },
    };

    const result = transformElasticResponse(mockResponse);

    expect(result.totalResults).toBe(2);
    expect(result.results).toEqual([{ name: 'Item 1' }, { name: 'Item 2' }]);
  });

  it('should transform response with numeric total', () => {
    const mockResponse: SearchResponse<{ id: number }> = {
      took: 1,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: 5,
        hits: [{ _index: 'test', _id: '1', _source: { id: 100 } }],
      },
    };

    const result = transformElasticResponse(mockResponse);

    expect(result.totalResults).toBe(5);
    expect(result.results).toEqual([{ id: 100 }]);
  });

  it('should filter out hits without _source', () => {
    const mockResponse: SearchResponse<{ name: string }> = {
      took: 1,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 3, relation: 'eq' },
        hits: [
          { _index: 'test', _id: '1', _source: { name: 'Item 1' } },
          { _index: 'test', _id: '2', _source: undefined },
          { _index: 'test', _id: '3', _source: { name: 'Item 3' } },
        ],
      },
    };

    const result = transformElasticResponse(mockResponse);

    expect(result.totalResults).toBe(3);
    expect(result.results).toEqual([{ name: 'Item 1' }, { name: 'Item 3' }]);
  });

  it('should handle empty hits', () => {
    const mockResponse: SearchResponse<{ name: string }> = {
      took: 1,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 0, relation: 'eq' },
        hits: [],
      },
    };

    const result = transformElasticResponse(mockResponse);

    expect(result.totalResults).toBe(0);
    expect(result.results).toEqual([]);
  });

  it('should default to 0 when total is undefined', () => {
    const mockResponse: SearchResponse<{ name: string }> = {
      took: 1,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        hits: [],
      },
    };

    const result = transformElasticResponse(mockResponse);

    expect(result.totalResults).toBe(0);
  });
});
