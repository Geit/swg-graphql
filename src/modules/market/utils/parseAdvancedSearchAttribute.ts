import { Container } from 'typedi';

import { ADVANCED_SEARCH_ATTRIBUTE_DATATABLE } from '../config';

import { DataTableService } from '@core/services/DataTableService';

export type SearchAttributeDataType = 'int' | 'float' | 'string' | 'enum';

/**
 * Row structure from the compiled advanced_search_attribute datatable.
 */
export interface AdvancedSearchAttributeRow {
  gameObjectType: string;
  searchAttributeName: string;
  searchAttributeDataType: number; // 0=unknown, 1=int, 2=float, 3=string, 4=enum
  // Default search values 1-200 (most will be empty strings)
  defaultSearchValue1?: string;
  defaultSearchValue2?: string;
  defaultSearchValue3?: string;
  defaultSearchValue4?: string;
  defaultSearchValue5?: string;
  // ... additional default values as needed
  [key: string]: string | number | undefined;
}

export interface ParsedSearchAttribute {
  gameObjectType: string;
  name: string;
  dataType: SearchAttributeDataType;
  enumValues: string[];
}

export interface ParsedSearchAttributeData {
  attributes: ParsedSearchAttribute[];
  /**
   * Map of game object type to its parent type (if any).
   * E.g., 'armor_body' -> 'armor'
   */
  typeHierarchy: Map<string, string | null>;
  /**
   * All unique game object types found in the file.
   */
  gameObjectTypes: Set<string>;
}

/**
 * Normalizes an attribute name to be ES-safe.
 * E.g., "@obj_attr_n:efficiency" -> "obj_attr_n_efficiency"
 */
export function normalizeAttributeName(name: string): string {
  return name.replace(/^@/, '').replace(/[:./]/g, '_').replace(/\s+/g, '_').toLowerCase();
}

/**
 * Determines the parent type for a given game object type based on underscore naming.
 * E.g., 'armor_body' -> 'armor', 'weapon_ranged_pistol' -> 'weapon_ranged'
 */
function getParentType(gameObjectType: string): string | null {
  const lastUnderscore = gameObjectType.lastIndexOf('_');
  if (lastUnderscore === -1) {
    return null;
  }
  return gameObjectType.substring(0, lastUnderscore);
}

function dataTypeFromInt(value: number): SearchAttributeDataType {
  switch (value) {
    case 1:
      return 'int';
    case 2:
      return 'float';
    case 3:
      return 'string';
    case 4:
      return 'enum';
    default:
      return 'string';
  }
}

/**
 * Loads and parses the advanced_search_attribute datatable.
 */
export async function loadAdvancedSearchAttribute(): Promise<ParsedSearchAttributeData> {
  const dataTableService = Container.get(DataTableService);

  const rows = await dataTableService.load<AdvancedSearchAttributeRow>({
    fileName: ADVANCED_SEARCH_ATTRIBUTE_DATATABLE,
    camelcase: true,
  });

  const attributes: ParsedSearchAttribute[] = [];
  const typeHierarchy = new Map<string, string | null>();
  const gameObjectTypes = new Set<string>();

  let currentGameObjectType = '';

  for (const row of rows) {
    // Update current game object type if provided
    if (row.gameObjectType) {
      currentGameObjectType = row.gameObjectType;
      gameObjectTypes.add(currentGameObjectType);

      // Build type hierarchy
      if (!typeHierarchy.has(currentGameObjectType)) {
        const parent = getParentType(currentGameObjectType);
        typeHierarchy.set(currentGameObjectType, parent);
      }
    }

    // Skip rows without attribute names (type-only rows)
    if (!row.searchAttributeName) {
      continue;
    }

    // Skip special markers
    if (row.searchAttributeName === 'no child inherit') continue;

    const dataType = dataTypeFromInt(row.searchAttributeDataType);

    // Collect enum values from defaultSearchValue columns
    const enumValues: string[] = [];
    if (dataType === 'enum') {
      for (let i = 1; i <= 200; i++) {
        const key = `defaultSearchValue${i}`;
        const val = row[key];
        if (typeof val === 'string' && val.trim()) {
          enumValues.push(val.trim());
        }
      }
    }

    attributes.push({
      gameObjectType: currentGameObjectType,
      name: row.searchAttributeName,
      dataType,
      enumValues,
    });
  }

  return {
    attributes,
    typeHierarchy,
    gameObjectTypes,
  };
}

/**
 * Builds the full category hierarchy for a given type.
 * E.g., 'armor_body' -> ['armor', 'armor_body']
 */
export function buildCategoryHierarchy(gameObjectType: string, typeHierarchy: Map<string, string | null>): string[] {
  const hierarchy: string[] = [];
  let current: string | null = gameObjectType;

  while (current) {
    hierarchy.unshift(current);
    current = typeHierarchy.get(current) ?? null;

    // Also try deriving parent from name if not in typeHierarchy
    if (!current && hierarchy.length === 1) {
      current = getParentType(gameObjectType);
    }
  }

  return hierarchy;
}

/**
 * Gets all attributes that apply to a given game object type,
 * including inherited attributes from parent types.
 */
export function getAttributesForType(
  gameObjectType: string,
  attributes: ParsedSearchAttribute[],
  typeHierarchy: Map<string, string | null>
): ParsedSearchAttribute[] {
  const hierarchy = buildCategoryHierarchy(gameObjectType, typeHierarchy);
  const result: ParsedSearchAttribute[] = [];
  const seenAttributes = new Set<string>();

  // Add attributes from parent to child (child overrides parent)
  for (const type of hierarchy) {
    for (const attr of attributes) {
      if (attr.gameObjectType === type && !seenAttributes.has(attr.name)) {
        result.push(attr);
        seenAttributes.add(attr.name);
      }
    }
  }

  return result;
}
