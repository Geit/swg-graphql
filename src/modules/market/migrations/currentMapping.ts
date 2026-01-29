import type { MappingProperty } from '@elastic/elasticsearch/lib/api/types';

import {
  ParsedSearchAttribute,
  normalizeAttributeName,
  SearchAttributeDataType,
} from '../utils/parseAdvancedSearchAttribute';

/**
 * Core market listing mapping properties.
 */
export const coreMarketMappingProperties: Record<string, MappingProperty> = {
  type: { type: 'keyword' },
  id: { type: 'keyword' },

  // Auction fields
  locationId: { type: 'keyword' },
  creatorId: { type: 'keyword' },
  ownerId: { type: 'keyword' },
  minBid: { type: 'long' },
  buyNowPrice: { type: 'long' },
  auctionTimer: { type: 'long' },
  userDescription: { type: 'text' },
  itemName: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  oob: { type: 'text' },
  category: { type: 'integer' },
  categoryHierarchy: { type: 'keyword' },
  itemTimer: { type: 'long' },
  active: { type: 'byte' },
  itemSize: { type: 'integer' },
  objectTemplateId: { type: 'integer' },

  // Location fields
  locationName: { type: 'text' },
  salesTax: { type: 'integer' },
  searchEnabled: { type: 'boolean' },
  planet: { type: 'keyword' },
  region: { type: 'keyword' },
  vendorName: { type: 'text' },

  // Bid fields
  currentBid: { type: 'long' },
  bidderId: { type: 'keyword' },
  maxProxyBid: { type: 'long' },

  // Flattened attributes - defined as object, properties added dynamically from datatable
  attributes: { type: 'object', dynamic: true },

  // Timestamps
  lastSeen: { type: 'date' },
  indexedAt: { type: 'date' },
};

/**
 * Maps search attribute data type to ES field type.
 * Numeric types use ignore_malformed to drop mismatched values instead of failing the document.
 */
function dataTypeToEsType(dataType: SearchAttributeDataType): MappingProperty {
  /* eslint-disable camelcase */
  switch (dataType) {
    case 'int':
      return { type: 'integer', ignore_malformed: true };
    case 'float':
      return { type: 'float', ignore_malformed: true };
    case 'string':
      return { type: 'keyword' };
    case 'enum':
      return { type: 'keyword' };
    default:
      return { type: 'keyword' };
  }
  /* eslint-enable */
}

/**
 * Generates ES mapping properties for search attributes.
 * Returns properties to be nested under the 'attributes' object.
 */
export function generateAttributeProperties(attributes: ParsedSearchAttribute[]): Record<string, MappingProperty> {
  const properties: Record<string, MappingProperty> = {};
  const seenAttributes = new Set<string>();

  for (const attr of attributes) {
    const normalizedName = normalizeAttributeName(attr.name);

    // Skip duplicates (same attribute may appear for multiple types)
    if (seenAttributes.has(normalizedName)) continue;
    seenAttributes.add(normalizedName);

    properties[normalizedName] = dataTypeToEsType(attr.dataType);
  }

  return properties;
}

/**
 * Combines core mappings with attribute mappings.
 */
export function buildFullMapping(attributes: ParsedSearchAttribute[]): Record<string, MappingProperty> {
  const attributeProperties = generateAttributeProperties(attributes);

  return {
    ...coreMarketMappingProperties,
    // Override the base attributes object with explicit properties from datatable
    attributes: {
      type: 'object',
      dynamic: true,
      properties: attributeProperties,
    },
  };
}
