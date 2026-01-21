import { MARKET_INDEX_NAME } from '../config';
import { loadAdvancedSearchAttribute } from '../utils/parseAdvancedSearchAttribute';

import { buildFullMapping, coreMarketMappingProperties } from './currentMapping';

import { elasticClient } from '@core/utils/elasticClient';

// Increased field limit to accommodate all item attributes from the datatable
const MAX_TOTAL_FIELDS = 3000;

export async function initialMarketIndexSetup() {
  console.log(`Attempting to setup the ${MARKET_INDEX_NAME} index in Elastic`);

  let mappingProperties = coreMarketMappingProperties;

  // Try to load search attributes to build full mapping
  try {
    const searchAttributeData = await loadAdvancedSearchAttribute();
    mappingProperties = buildFullMapping(searchAttributeData.attributes);
    console.log(`Loaded ${searchAttributeData.attributes.length} search attributes for mapping`);
  } catch (err) {
    console.warn(
      `Could not load advanced_search_attribute datatable, using core mappings only: ${
        err instanceof Error ? err.message : err
      }`
    );
  }

  const indexExists = await elasticClient.indices.exists({ index: MARKET_INDEX_NAME });

  try {
    if (indexExists) {
      // Update settings for existing index (increase field limit if needed)
      await elasticClient.indices.putSettings({
        index: MARKET_INDEX_NAME,
        body: {
          'index.mapping.total_fields.limit': MAX_TOTAL_FIELDS,
        },
      });

      await elasticClient.indices.putMapping({
        index: MARKET_INDEX_NAME,
        body: {
          properties: mappingProperties,
        },
      });
      console.log(`Updated mapping for ${MARKET_INDEX_NAME} index`);
    } else {
      await elasticClient.indices.create({
        index: MARKET_INDEX_NAME,
        body: {
          settings: {
            'index.mapping.total_fields.limit': MAX_TOTAL_FIELDS,
            'index.mapping.ignore_malformed': true,
          },
          mappings: {
            properties: mappingProperties,
          },
        },
      });
      console.log(`Created ${MARKET_INDEX_NAME} index`);
    }
  } catch (e) {
    console.error(`Failed to setup ${MARKET_INDEX_NAME} index:`, e);
    throw e;
  }
}
