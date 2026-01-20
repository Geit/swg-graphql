import { MARKET_INDEX_NAME } from '../config';
import { loadAdvancedSearchAttribute } from '../utils/parseAdvancedSearchAttribute';

import { buildFullMapping, coreMarketMappingProperties } from './currentMapping';

import { elasticClient } from '@core/utils/elasticClient';

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
