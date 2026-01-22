import { Container } from 'typedi';

import { ADVANCED_SEARCH_ATTRIBUTE_DATATABLE } from '../config';

import { GameObjectType, getMaskedType, isSubType } from './gameObjectType';

import { DataTableService } from '@core/services/DataTableService';
import { getStringCrc } from '@core/utils/crc';

// ============================================================================
// Types
// ============================================================================

export type SearchAttributeDataType = 'int' | 'float' | 'string' | 'enum';

/**
 * A searchable attribute as defined in the datatable.
 */
export interface SearchAttribute {
  /** The canonical attribute name */
  attributeName: string;
  /** CRC-32 of the attribute name */
  attributeNameCrc: number;
  /** Data type of this attribute */
  attributeDataType: SearchAttributeDataType;
  /** Canonical enum/string values (for enum/string types only) */
  defaultSearchValueList: string[];
  /** Map of enum value alias -> canonical value (for enum type only) */
  enumValueAliasList: Map<string, string>;
}

/**
 * Raw row structure from the datatable.
 */
interface AdvancedSearchAttributeRow {
  gameObjectType: string;
  searchAttributeName: string;
  searchAttributeDataType: number;
  [key: string]: string | number | undefined;
}

/**
 * Backward-compatible parsed attribute interface.
 */
export interface ParsedSearchAttribute {
  gameObjectType: string;
  name: string;
  dataType: SearchAttributeDataType;
  enumValues: string[];
}

/**
 * Complete parsed data from the datatable.
 */
export interface ParsedSearchAttributeData {
  /** Flat array of all attributes (backward compatible) */
  attributes: ParsedSearchAttribute[];
  /** Map of type -> parent type (backward compatible) */
  typeHierarchy: Map<string, string | null>;
  /** All game object types encountered */
  gameObjectTypes: Set<string>;
  /** Map of GOT -> (attributeName -> SearchAttribute) */
  attributesByType: Map<string, Map<string, SearchAttribute>>;
  /** Map of GOT -> (aliasName -> canonicalName) */
  aliasesByType: Map<string, Map<string, string>>;
  /** Set of GOTs that do not inherit to children */
  noChildInheritTypes: Set<string>;
}

// ============================================================================
// Constants
// ============================================================================

const BLANK_SPACE_MARKER = '<<<a_blank_space>>>';

// Build reverse lookup: name -> GOT value
const nameToGotValue = new Map<string, number>(
  Object.entries(GameObjectType).map(([key, value]) => [key.replace('GOT_', ''), value])
);

// ============================================================================
// Helpers
// ============================================================================

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

function getParentTypeName(gotValue: number): string | null {
  if (!isSubType(gotValue)) {
    return null;
  }
  const maskedValue = getMaskedType(gotValue);
  for (const [name, value] of nameToGotValue) {
    if (value === maskedValue) {
      return name;
    }
  }
  return null;
}

/**
 * Parse attribute name tokens to extract canonical name and aliases.
 * Format: "canonical_name alias1 alias2 ..."
 */
function parseAttributeNameTokens(nameField: string): { canonicalName: string; aliases: string[] } {
  const tokens = nameField.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) {
    return { canonicalName: '', aliases: [] };
  }
  return {
    canonicalName: tokens[0],
    aliases: tokens.slice(1),
  };
}

/**
 * Parse enum value tokens to extract canonical value and aliases.
 * Format: "@canonical_value alias1 alias2 ..."
 * Special: "<<<a_blank_space>>>" becomes " "
 */
function parseEnumValueTokens(valueField: string): { canonicalValue: string; aliases: string[] } {
  const tokens = valueField.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) {
    return { canonicalValue: '', aliases: [] };
  }

  const canonicalValue = tokens[0];
  const aliases = tokens.slice(1).map(alias => (alias === BLANK_SPACE_MARKER ? ' ' : alias));

  return { canonicalValue, aliases };
}

/**
 * Collect default search values from the row.
 * Iterates through Default Search Value 1, 2, 3... until one is not found.
 */
function collectDefaultValues(row: AdvancedSearchAttributeRow): string[] {
  const values: string[] = [];
  for (let i = 1; ; i++) {
    const key = `defaultSearchValue${i}`;
    const val = row[key];
    if (val === undefined) {
      break;
    }
    if (typeof val === 'string' && val.length > 0) {
      values.push(val);
    }
  }
  return values;
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Loads and parses the advanced_search_attribute datatable.
 */
export async function loadAdvancedSearchAttribute(): Promise<ParsedSearchAttributeData> {
  const dataTableService = Container.get(DataTableService);

  const rows = await dataTableService.load<AdvancedSearchAttributeRow>({
    fileName: ADVANCED_SEARCH_ATTRIBUTE_DATATABLE,
    camelcase: true,
  });

  // State tracking
  let currentGotName = '';
  let currentGotValue = 0;

  // Output data structures
  const attributesByType = new Map<string, Map<string, SearchAttribute>>();
  const aliasesByType = new Map<string, Map<string, string>>();
  const noChildInheritTypes = new Set<string>();
  const excludesByType = new Map<string, Set<string>>();
  const gameObjectTypes = new Set<string>();
  const typeHierarchy = new Map<string, string | null>();

  // -------------------------------------------------------------------------
  // First Pass: Parse all rows
  // -------------------------------------------------------------------------

  for (const row of rows) {
    const rawGot = row.gameObjectType ?? '';
    const rawAttrName = row.searchAttributeName ?? '';

    // Handle Game Object Type
    if (rawGot.length > 0) {
      const gotValue = nameToGotValue.get(rawGot) ?? 0;
      if (gotValue === 0) {
        continue;
      }

      currentGotName = rawGot;
      currentGotValue = gotValue;
      gameObjectTypes.add(currentGotName);

      // Build type hierarchy
      if (!typeHierarchy.has(currentGotName)) {
        const parentName = getParentTypeName(currentGotValue);
        typeHierarchy.set(currentGotName, parentName);
      }

      // Initialize maps for this type
      if (!attributesByType.has(currentGotName)) {
        attributesByType.set(currentGotName, new Map());
      }
      if (!aliasesByType.has(currentGotName)) {
        aliasesByType.set(currentGotName, new Map());
      }
    }

    // Skip if no attribute name or no current GOT
    if (rawAttrName.length === 0 || currentGotName.length === 0) {
      continue;
    }

    // -----------------------------------------------------------------------
    // Handle special directives
    // -----------------------------------------------------------------------

    // Handle "no child inherit"
    if (rawAttrName === 'no child inherit') {
      noChildInheritTypes.add(currentGotName);
      continue;
    }

    // Handle "exclude <attribute_name>"
    if (rawAttrName.startsWith('exclude ')) {
      const excludedAttr = rawAttrName.slice(8).trim();
      if (!excludesByType.has(currentGotName)) {
        excludesByType.set(currentGotName, new Set());
      }
      excludesByType.get(currentGotName)!.add(excludedAttr);
      continue;
    }

    // -----------------------------------------------------------------------
    // Parse normal attribute
    // -----------------------------------------------------------------------

    const { canonicalName, aliases: nameAliases } = parseAttributeNameTokens(rawAttrName);
    if (canonicalName.length === 0) {
      continue;
    }

    const dataType = dataTypeFromInt(row.searchAttributeDataType);
    const attrCrc = getStringCrc(canonicalName);

    // Collect default values
    const defaultValueFields = collectDefaultValues(row);

    // Parse enum values and their aliases
    const defaultSearchValueList: string[] = [];
    const enumValueAliasList = new Map<string, string>();

    if (dataType === 'enum') {
      for (const valueField of defaultValueFields) {
        const { canonicalValue, aliases: valueAliases } = parseEnumValueTokens(valueField);
        if (canonicalValue.length > 0) {
          defaultSearchValueList.push(canonicalValue);

          for (const alias of valueAliases) {
            enumValueAliasList.set(alias, canonicalValue);
          }
        }
      }
    } else if (dataType === 'string') {
      for (const valueField of defaultValueFields) {
        if (valueField.length > 0) {
          defaultSearchValueList.push(valueField);
        }
      }
    }

    // Create the SearchAttribute
    const searchAttr: SearchAttribute = {
      attributeName: canonicalName,
      attributeNameCrc: attrCrc,
      attributeDataType: dataType,
      defaultSearchValueList,
      enumValueAliasList,
    };

    // Store the attribute
    const typeAttrs = attributesByType.get(currentGotName)!;
    typeAttrs.set(canonicalName, searchAttr);

    // Store attribute name aliases
    const typeAliases = aliasesByType.get(currentGotName)!;
    for (const alias of nameAliases) {
      typeAliases.set(alias, canonicalName);
    }
  }

  // -------------------------------------------------------------------------
  // Second Pass: Apply inheritance
  // -------------------------------------------------------------------------

  for (const [typeName, gotValue] of nameToGotValue) {
    if (!gameObjectTypes.has(typeName) || !isSubType(gotValue)) {
      continue;
    }

    const parentName = getParentTypeName(gotValue);
    if (!parentName || !gameObjectTypes.has(parentName) || noChildInheritTypes.has(parentName)) {
      continue;
    }

    const parentAttrs = attributesByType.get(parentName);
    const childAttrs = attributesByType.get(typeName);
    const childExcludes = excludesByType.get(typeName) ?? new Set();
    const parentAliases = aliasesByType.get(parentName);
    const childAliases = aliasesByType.get(typeName);

    if (!parentAttrs || !childAttrs) {
      continue;
    }

    // Copy parent attributes to child (unless excluded or already defined)
    for (const [attrName, attr] of parentAttrs) {
      if (!childExcludes.has(attrName) && !childAttrs.has(attrName)) {
        childAttrs.set(attrName, attr);
      }
    }

    // Copy parent aliases to child
    if (parentAliases && childAliases) {
      for (const [alias, canonicalName] of parentAliases) {
        if (!childAliases.has(alias)) {
          childAliases.set(alias, canonicalName);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Build backward-compatible flat array
  // -------------------------------------------------------------------------

  const attributes: ParsedSearchAttribute[] = [];

  for (const [typeName, attrMap] of attributesByType) {
    for (const [, attr] of attrMap) {
      // Only add if this is the "owning" type (avoid duplicates from inheritance)
      const parentName = typeHierarchy.get(typeName);
      if (parentName) {
        const parentAttrs = attributesByType.get(parentName);
        if (parentAttrs?.has(attr.attributeName)) {
          continue;
        }
      }

      attributes.push({
        gameObjectType: typeName,
        name: attr.attributeName,
        dataType: attr.attributeDataType,
        enumValues: attr.defaultSearchValueList,
      });
    }
  }

  return {
    attributes,
    typeHierarchy,
    gameObjectTypes,
    attributesByType,
    aliasesByType,
    noChildInheritTypes,
  };
}

// ============================================================================
// Public Utility Functions
// ============================================================================

/**
 * Normalizes an attribute name to be ES-safe.
 * E.g., "@obj_attr_n:efficiency" -> "obj_attr_n_efficiency"
 */
export function normalizeAttributeName(name: string): string {
  return name.replace(/^@/, '').replace(/[:./]/g, '_').replace(/\s+/g, '_').toLowerCase();
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

    // Also try deriving parent from GOT if not in typeHierarchy
    if (!current && hierarchy.length === 1) {
      const gotValue = nameToGotValue.get(gameObjectType);
      if (gotValue !== undefined) {
        current = getParentTypeName(gotValue);
      }
    }
  }

  return hierarchy;
}

/**
 * Gets all attributes that apply to a given game object type,
 * including inherited attributes from parent types.
 *
 * Since inheritance is now applied during parsing, this simply returns
 * the attributes from the attributesByType map.
 */
export function getAttributesForType(
  gameObjectType: string,
  _attributes: ParsedSearchAttribute[],
  _typeHierarchy: Map<string, string | null>,
  attributesByType?: Map<string, Map<string, SearchAttribute>>
): ParsedSearchAttribute[] {
  // If we have the new attributesByType map, use it directly
  if (attributesByType) {
    const typeAttrs = attributesByType.get(gameObjectType);
    if (!typeAttrs) {
      return [];
    }
    return Array.from(typeAttrs.values()).map(attr => ({
      gameObjectType,
      name: attr.attributeName,
      dataType: attr.attributeDataType,
      enumValues: attr.defaultSearchValueList,
    }));
  }

  // Fallback to old behavior for backward compatibility
  const hierarchy = buildCategoryHierarchy(gameObjectType, _typeHierarchy);
  const result: ParsedSearchAttribute[] = [];
  const seenAttributes = new Set<string>();

  for (const type of hierarchy) {
    for (const attr of _attributes) {
      if (attr.gameObjectType === type && !seenAttributes.has(attr.name)) {
        result.push(attr);
        seenAttributes.add(attr.name);
      }
    }
  }

  return result;
}

/**
 * Resolves an attribute name to its canonical form.
 * Checks if the input is an alias and returns the canonical name.
 */
export function resolveAttributeName(
  gameObjectType: string,
  inputName: string,
  attributesByType: Map<string, Map<string, SearchAttribute>>,
  aliasesByType: Map<string, Map<string, string>>
): SearchAttribute | null {
  const typeAttrs = attributesByType.get(gameObjectType);
  if (!typeAttrs) {
    return null;
  }

  // Direct lookup
  if (typeAttrs.has(inputName)) {
    return typeAttrs.get(inputName)!;
  }

  // Check aliases
  const aliases = aliasesByType.get(gameObjectType);
  if (aliases?.has(inputName)) {
    const canonicalName = aliases.get(inputName)!;
    return typeAttrs.get(canonicalName) ?? null;
  }

  return null;
}

/**
 * Resolves an enum value to its canonical form.
 * Checks if the input is an alias and returns the canonical value.
 */
export function resolveEnumValue(searchAttribute: SearchAttribute, inputValue: string): string {
  if (searchAttribute.enumValueAliasList.has(inputValue)) {
    return searchAttribute.enumValueAliasList.get(inputValue)!;
  }
  return inputValue;
}

/**
 * Gets all searchable attributes for a game object type.
 * Returns a map of canonical attribute name -> SearchAttribute.
 */
export function getSearchableAttributes(
  gameObjectType: string,
  attributesByType: Map<string, Map<string, SearchAttribute>>
): Map<string, SearchAttribute> {
  return attributesByType.get(gameObjectType) ?? new Map();
}
