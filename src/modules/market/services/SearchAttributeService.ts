import { Service } from 'typedi';

import {
  loadAdvancedSearchAttribute,
  buildCategoryHierarchy,
  getAttributesForType,
  ParsedSearchAttribute,
  ParsedSearchAttributeData,
} from '../utils/parseAdvancedSearchAttribute';
import { GameObjectType, isTypeOf } from '../utils/gameObjectType';

/**
 * Service for managing search attribute data loaded from the datatable.
 * Initialized once at startup and cached.
 */
@Service({ global: true })
export class SearchAttributeService {
  private data: ParsedSearchAttributeData | null = null;
  private initialized = false;

  /**
   * Initializes the service by loading the search attribute datatable.
   * Should be called once at module startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.data = await loadAdvancedSearchAttribute();
      this.initialized = true;
      console.log(
        `SearchAttributeService initialized with ${this.data.attributes.length} attributes and ${this.data.gameObjectTypes.size} game object types`
      );
    } catch (err) {
      console.error(`Failed to initialize SearchAttributeService: ${err instanceof Error ? err.message : err}`);
      // Initialize with empty data to prevent repeated failed loads
      this.data = {
        attributes: [],
        typeHierarchy: new Map(),
        gameObjectTypes: new Set(),
      };
      this.initialized = true;
    }
  }

  /**
   * Returns all parsed search attributes.
   */
  getAllAttributes(): ParsedSearchAttribute[] {
    return this.data?.attributes ?? [];
  }

  /**
   * Returns all unique game object types.
   */
  getGameObjectTypes(): Set<string> {
    return this.data?.gameObjectTypes ?? new Set();
  }

  /**
   * Returns the type hierarchy map.
   */
  getTypeHierarchy(): Map<string, string | null> {
    return this.data?.typeHierarchy ?? new Map();
  }

  /**
   * Gets all attributes that apply to a given game object type,
   * including inherited attributes from parent types.
   */
  getAttributesForType(gameObjectType: string): ParsedSearchAttribute[] {
    if (!this.data) return [];
    return getAttributesForType(gameObjectType, this.data.attributes, this.data.typeHierarchy);
  }

  /**
   * Gets all attributes for a category, including:
   * - Attributes inherited from parent types
   * - Attributes from all descendant types
   * E.g., 'armor_body' returns attributes for armor (parent), armor_body, and any children.
   */
  getAttributesForCategory(gameObjectType: string): ParsedSearchAttribute[] {
    if (!this.data) return [];

    // Get parent types from the hierarchy
    const parentTypes = new Set(this.buildCategoryHierarchy(gameObjectType));

    // Get descendant types
    const descendantTypes = this.getDescendantTypes(gameObjectType);

    // Combine parent and descendant types
    const allTypes = new Set([...parentTypes, ...descendantTypes]);

    // Collect unique attributes from all relevant types
    const seenAttributes = new Set<string>();
    const result: ParsedSearchAttribute[] = [];

    for (const attr of this.data.attributes) {
      if (allTypes.has(attr.gameObjectType) && !seenAttributes.has(attr.name)) {
        result.push(attr);
        seenAttributes.add(attr.name);
      }
    }

    return result;
  }

  /**
   * Gets all types that are descendants of the given type (including the type itself).
   * Uses the GOT bitmask hierarchy where child types share the parent's masked value.
   */
  private getDescendantTypes(gameObjectType: string): Set<string> {
    if (!this.data) return new Set([gameObjectType]);

    const descendants = new Set<string>();

    // Look up the numeric value for the parent type
    const gotKey = `GOT_${gameObjectType}` as keyof typeof GameObjectType;
    const parentValue = GameObjectType[gotKey];

    if (parentValue === undefined) {
      // Type not found in GOT enum, fall back to exact match
      descendants.add(gameObjectType);
      return descendants;
    }

    // Find all types that are the parent or a child of it
    for (const typeName of this.data.gameObjectTypes) {
      const typeKey = `GOT_${typeName}` as keyof typeof GameObjectType;
      const typeValue = GameObjectType[typeKey];

      if (typeValue !== undefined && isTypeOf(typeValue, parentValue)) {
        descendants.add(typeName);
      }
    }

    return descendants;
  }

  /**
   * Builds the full category hierarchy for a given type.
   * E.g., 'armor_body' -> ['armor', 'armor_body']
   */
  buildCategoryHierarchy(gameObjectType: string): string[] {
    if (!this.data) return [gameObjectType];
    return buildCategoryHierarchy(gameObjectType, this.data.typeHierarchy);
  }

  /**
   * Returns whether the service has been initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
