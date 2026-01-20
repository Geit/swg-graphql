import { Service } from 'typedi';

import {
  loadAdvancedSearchAttribute,
  buildCategoryHierarchy,
  getAttributesForType,
  ParsedSearchAttribute,
  ParsedSearchAttributeData,
} from '../utils/parseAdvancedSearchAttribute';

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
