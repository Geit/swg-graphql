/* eslint-disable camelcase */
/**
 * Game Object Types (GOT) - maps category integers to canonical names
 * Based on SharedObjectTemplate::GameObjectType enum
 */
export const GameObjectType = {
  // Base types (0x00000000 range)
  GOT_none: 0x00000000,
  GOT_corpse: 0x00000001,
  GOT_group: 0x00000002,
  GOT_guild: 0x00000003,
  GOT_lair: 0x00000004,
  GOT_static: 0x00000005,
  GOT_camp: 0x00000006,
  GOT_vendor: 0x00000007,
  GOT_loadbeacon: 0x00000008,

  // Armor (0x00000100 range)
  GOT_armor: 0x00000100,
  GOT_armor_body: 0x00000101,
  GOT_armor_head: 0x00000102,
  GOT_armor_misc: 0x00000103,
  GOT_armor_leg: 0x00000104,
  GOT_armor_arm: 0x00000105,
  GOT_armor_hand: 0x00000106,
  GOT_armor_foot: 0x00000107,
  GOT_armor_shield: 0x00000108,
  GOT_armor_layer: 0x00000109,
  GOT_armor_segment: 0x0000010a,
  GOT_armor_core: 0x0000010b,
  GOT_armor_psg: 0x0000010c,

  // Building (0x00000200 range)
  GOT_building: 0x00000200,
  GOT_building_municipal: 0x00000201,
  GOT_building_player: 0x00000202,
  GOT_building_factional: 0x00000203,

  // Creature (0x00000400 range)
  GOT_creature: 0x00000400,
  GOT_creature_character: 0x00000401,
  GOT_creature_droid: 0x00000402,
  GOT_creature_droid_probe: 0x00000403,
  GOT_creature_monster: 0x00000404,

  // Data (0x00000800 range)
  GOT_data: 0x00000800,
  GOT_data_draft_schematic: 0x00000801,
  GOT_data_manufacturing_schematic: 0x00000802,
  GOT_data_mission_object: 0x00000803,
  GOT_data_token: 0x00000804,
  GOT_data_waypoint: 0x00000805,
  GOT_data_fictional: 0x00000806,
  GOT_data_pet_control_device: 0x00000807,
  GOT_data_vehicle_control_device: 0x00000808,
  GOT_data_draft_schematic_read_only: 0x00000809,
  GOT_data_ship_control_device: 0x0000080a,
  GOT_data_droid_control_device: 0x0000080b,
  GOT_data_house_control_device: 0x0000080c,
  GOT_data_vendor_control_device: 0x0000080d,
  GOT_data_player_quest_object: 0x0000080e,

  // Chronicles (0x00001100 range)
  GOT_chronicles: 0x00001100,
  GOT_chronicles_relic: 0x00001101,
  GOT_chronicles_chronicle: 0x00001102,
  GOT_chronicles_quest_holocron: 0x00001103,
  GOT_chronicles_quest_holocron_recipe: 0x00001104,
  GOT_chronicles_relic_fragment: 0x00001105,

  // Installation (0x00001000 range)
  GOT_installation: 0x00001000,
  GOT_installation_factory: 0x00001001,
  GOT_installation_generator: 0x00001002,
  GOT_installation_harvester: 0x00001003,
  GOT_installation_turret: 0x00001004,
  GOT_installation_minefield: 0x00001005,

  // Misc (0x00002000 range)
  GOT_misc: 0x00002000,
  GOT_misc_ammunition: 0x00002001,
  GOT_misc_chemical: 0x00002002,
  GOT_misc_clothing_DUMMY: 0x00002003,
  GOT_misc_component_DUMMY: 0x00002004,
  GOT_misc_container: 0x00002005,
  GOT_misc_crafting_station: 0x00002006,
  GOT_misc_deed_DUMMY: 0x00002007,
  GOT_misc_electronics: 0x00002008,
  GOT_misc_flora: 0x00002009,
  GOT_misc_food: 0x0000200a,
  GOT_misc_furniture: 0x0000200b,
  GOT_misc_instrument: 0x0000200c,
  GOT_misc_pharmaceutical: 0x0000200d,
  GOT_misc_resource_container_DUMMY: 0x0000200e,
  GOT_misc_sign: 0x0000200f,
  GOT_misc_counter: 0x00002010,
  GOT_misc_factory_crate: 0x00002011,
  GOT_misc_ticket_travel: 0x00002012,
  GOT_misc_item: 0x00002013,
  GOT_misc_trap: 0x00002014,
  GOT_misc_container_wearable: 0x00002015,
  GOT_misc_fishing_pole: 0x00002016,
  GOT_misc_fishing_bait: 0x00002017,
  GOT_misc_drink: 0x00002018,
  GOT_misc_firework: 0x00002019,
  GOT_misc_item_usable: 0x0000201a,
  GOT_misc_petmed: 0x0000201b,
  GOT_misc_firework_show: 0x0000201c,
  GOT_misc_clothing_attachment: 0x0000201d,
  GOT_misc_live_sample: 0x0000201e,
  GOT_misc_armor_attachment: 0x0000201f,
  GOT_misc_community_crafting_project: 0x00002020,
  GOT_misc_force_crystal: 0x00002021,
  GOT_misc_droid_programming_chip: 0x00002022,
  GOT_misc_asteroid: 0x00002023,
  GOT_misc_pob_ship_pilot_chair: 0x00002024,
  GOT_misc_operations_chair: 0x00002025,
  GOT_misc_turret_access_ladder: 0x00002026,
  GOT_misc_container_ship_loot: 0x00002027,
  GOT_misc_armor_noequip: 0x00002028,
  GOT_misc_enzyme: 0x00002029,
  GOT_misc_food_pet: 0x0000202a,
  GOT_misc_collection: 0x0000202b,
  GOT_misc_container_public: 0x0000202c,
  GOT_misc_ground_target: 0x0000202d,
  GOT_misc_blueprint: 0x0000202e,
  GOT_misc_enzyme_isomerase: 0x0000202f,
  GOT_misc_enzyme_lyase: 0x00002030,
  GOT_misc_enzyme_hydrolase: 0x00002031,
  GOT_misc_tcg_card: 0x00002032,
  GOT_misc_appearance_only: 0x00002033,
  GOT_misc_appearance_only_invisible: 0x00002034,

  // Terminal (0x00004000 range)
  GOT_terminal: 0x00004000,
  GOT_terminal_bank: 0x00004001,
  GOT_terminal_bazaar: 0x00004002,
  GOT_terminal_cloning: 0x00004003,
  GOT_terminal_insurance: 0x00004004,
  GOT_terminal_manage: 0x00004005,
  GOT_terminal_mission: 0x00004006,
  GOT_terminal_permissions: 0x00004007,
  GOT_terminal_player_structure: 0x00004008,
  GOT_terminal_shipping: 0x00004009,
  GOT_terminal_travel: 0x0000400a,
  GOT_terminal_space: 0x0000400b,
  GOT_terminal_misc: 0x0000400c,
  GOT_terminal_space_npe: 0x0000400d,

  // Tool (0x00008000 range)
  GOT_tool: 0x00008000,
  GOT_tool_crafting: 0x00008001,
  GOT_tool_survey: 0x00008002,
  GOT_tool_repair: 0x00008003,
  GOT_tool_camp_kit: 0x00008004,
  GOT_tool_ship_component_repair: 0x00008005,
  GOT_tool_ship_component_retrofit_kit: 0x00008006,

  // Vehicle (0x00010000 range)
  GOT_vehicle: 0x00010000,
  GOT_vehicle_hover: 0x00010001,
  GOT_vehicle_hover_ai: 0x00010002,

  // Weapon (0x00020000 range)
  GOT_weapon: 0x00020000,
  GOT_weapon_melee_misc: 0x00020001,
  GOT_weapon_ranged_misc: 0x00020002,
  GOT_weapon_ranged_thrown: 0x00020003,
  GOT_weapon_heavy_misc: 0x00020004,
  GOT_weapon_heavy_mine: 0x00020005,
  GOT_weapon_heavy_special: 0x00020006,
  GOT_weapon_melee_1h: 0x00020007,
  GOT_weapon_melee_2h: 0x00020008,
  GOT_weapon_melee_polearm: 0x00020009,
  GOT_weapon_ranged_pistol: 0x0002000a,
  GOT_weapon_ranged_carbine: 0x0002000b,
  GOT_weapon_ranged_rifle: 0x0002000c,

  // Component (0x00040000 range)
  GOT_component: 0x00040000,
  GOT_component_armor: 0x00040001,
  GOT_component_chemistry: 0x00040002,
  GOT_component_clothing: 0x00040003,
  GOT_component_droid: 0x00040004,
  GOT_component_electronics: 0x00040005,
  GOT_component_munition: 0x00040006,
  GOT_component_structure: 0x00040007,
  GOT_component_weapon_melee: 0x00040008,
  GOT_component_weapon_ranged: 0x00040009,
  GOT_component_tissue: 0x0004000a,
  GOT_component_genetic: 0x0004000b,
  GOT_component_saber_crystal: 0x0004000c,
  GOT_component_community_crafting: 0x0004000d,
  GOT_component_new_armor: 0x0004000e,

  // Powerup Weapon (0x00080000 range)
  GOT_powerup_weapon: 0x00080000,
  GOT_powerup_weapon_melee: 0x00080001,
  GOT_powerup_weapon_ranged: 0x00080002,
  GOT_powerup_weapon_thrown: 0x00080003,
  GOT_powerup_weapon_heavy: 0x00080004,
  GOT_powerup_weapon_mine: 0x00080005,
  GOT_powerup_weapon_heavy_special: 0x00080006,

  // Powerup Armor (0x00100000 range)
  GOT_powerup_armor: 0x00100000,
  GOT_powerup_armor_body: 0x00100001,
  GOT_powerup_armor_head: 0x00100002,
  GOT_powerup_armor_misc: 0x00100003,
  GOT_powerup_armor_leg: 0x00100004,
  GOT_powerup_armor_arm: 0x00100005,
  GOT_powerup_armor_hand: 0x00100006,
  GOT_powerup_armor_foot: 0x00100007,
  GOT_powerup_armor_layer: 0x00100008,
  GOT_powerup_armor_segment: 0x00100009,
  GOT_powerup_armor_core: 0x0010000a,

  // Jewelry (0x00200000 range)
  GOT_jewelry: 0x00200000,
  GOT_jewelry_ring: 0x00200001,
  GOT_jewelry_bracelet: 0x00200002,
  GOT_jewelry_necklace: 0x00200003,
  GOT_jewelry_earring: 0x00200004,

  // Resource Container (0x00400000 range)
  GOT_resource_container: 0x00400000,
  GOT_resource_container_energy_gas: 0x00400001,
  GOT_resource_container_energy_liquid: 0x00400002,
  GOT_resource_container_energy_radioactive: 0x00400003,
  GOT_resource_container_energy_solid: 0x00400004,
  GOT_resource_container_inorganic_chemicals: 0x00400005,
  GOT_resource_container_inorganic_gas: 0x00400006,
  GOT_resource_container_inorganic_minerals: 0x00400007,
  GOT_resource_container_inorganic_water: 0x00400008,
  GOT_resource_container_organic_food: 0x00400009,
  GOT_resource_container_organic_hide: 0x0040000a,
  GOT_resource_container_organic_structure: 0x0040000b,
  GOT_resource_container_pseudo: 0x0040000c,
  GOT_resource_container_space: 0x0040000d,

  // Deed (0x00800000 range)
  GOT_deed: 0x00800000,
  GOT_deed_building: 0x00800001,
  GOT_deed_installation: 0x00800002,
  GOT_deed_pet: 0x00800003,
  GOT_deed_droid: 0x00800004,
  GOT_deed_vehicle: 0x00800005,

  // Clothing (0x01000000 range)
  GOT_clothing: 0x01000000,
  GOT_clothing_bandolier: 0x01000001,
  GOT_clothing_belt: 0x01000002,
  GOT_clothing_bodysuit: 0x01000003,
  GOT_clothing_cape: 0x01000004,
  GOT_clothing_cloak: 0x01000005,
  GOT_clothing_foot: 0x01000006,
  GOT_clothing_dress: 0x01000007,
  GOT_clothing_hand: 0x01000008,
  GOT_clothing_eye: 0x01000009,
  GOT_clothing_head: 0x0100000a,
  GOT_clothing_jacket: 0x0100000b,
  GOT_clothing_pants: 0x0100000c,
  GOT_clothing_robe: 0x0100000d,
  GOT_clothing_shirt: 0x0100000e,
  GOT_clothing_vest: 0x0100000f,
  GOT_clothing_wookiee: 0x01000010,
  GOT_clothing_misc: 0x01000011,
  GOT_clothing_skirt: 0x01000012,

  // Ship (0x20000000 range)
  GOT_ship: 0x20000000,
  GOT_ship_fighter: 0x20000001,
  GOT_ship_capital: 0x20000002,
  GOT_ship_station: 0x20000003,
  GOT_ship_transport: 0x20000004,
  GOT_ship_mining_asteroid_static: 0x20000005,
  GOT_ship_mining_asteroid_dynamic: 0x20000006,

  // Cybernetic (0x20000100 range)
  GOT_cybernetic: 0x20000100,
  GOT_cybernetic_arm: 0x20000101,
  GOT_cybernetic_legs: 0x20000102,
  GOT_cybernetic_torso: 0x20000103,
  GOT_cybernetic_forearm: 0x20000104,
  GOT_cybernetic_hand: 0x20000105,
  GOT_cybernetic_component: 0x20000106,

  // Ship Component (0x40000000 range)
  GOT_ship_component: 0x40000000,
  GOT_ship_component_reactor: 0x40000001,
  GOT_ship_component_engine: 0x40000002,
  GOT_ship_component_shield: 0x40000003,
  GOT_ship_component_armor: 0x40000004,
  GOT_ship_component_weapon: 0x40000005,
  GOT_ship_component_capacitor: 0x40000006,
  GOT_ship_component_booster: 0x40000007,
  GOT_ship_component_droid_interface: 0x40000008,
  GOT_ship_component_hangar: 0x40000009,
  GOT_ship_component_targeting_station: 0x4000000a,
  GOT_ship_component_bridge: 0x4000000b,
  GOT_ship_component_chassis: 0x4000000c,
  GOT_ship_component_missilepack: 0x4000000d,
  GOT_ship_component_countermeasurepack: 0x4000000e,
  GOT_ship_component_missilelauncher: 0x4000000f,
  GOT_ship_component_countermeasurelauncher: 0x40000010,
  GOT_ship_component_cargo_hold: 0x40000011,
  GOT_ship_component_modification: 0x40000012,
} as const;

/* eslint-enable */

export type GameObjectTypeKey = keyof typeof GameObjectType;
export type GameObjectTypeValue = (typeof GameObjectType)[GameObjectTypeKey];

// Reverse lookup map: int -> name
const categoryToName = new Map<number, string>(
  Object.entries(GameObjectType).map(([name, value]) => [value, name.replace('GOT_', '')])
);

// Type mask for extracting parent category
const TYPE_MASK = 0xffffff00;

/**
 * Get the canonical name for a category integer
 */
export function getCategoryName(category: number): string {
  return categoryToName.get(category) ?? 'unknown';
}

/**
 * Get the parent category for a given type
 */
export function getMaskedType(type: number): number {
  return type & TYPE_MASK;
}

/**
 * Get the subtype portion of a category
 */
export function getSubType(type: number): number {
  return type & ~TYPE_MASK;
}

/**
 * Check if a type is a subtype (has non-zero lower bits)
 */
export function isSubType(type: number): boolean {
  return (type & ~TYPE_MASK) !== 0;
}

/**
 * Check if a type matches or is a subtype of another type
 */
export function isTypeOf(type: number, typeToTestAgainst: number): boolean {
  if (type === typeToTestAgainst) return true;
  if (getMaskedType(type) === typeToTestAgainst) return true;
  return false;
}

/**
 * Build a category hierarchy for a given category integer.
 * Returns an array of category names from parent to child.
 * E.g., 0x00000101 (armor_body) -> ['armor', 'armor_body']
 */
export function buildCategoryHierarchy(category: number): string[] {
  const hierarchy: string[] = [];

  // If it's a subtype, add the parent first
  if (isSubType(category)) {
    const parentCategory = getMaskedType(category);
    const parentName = getCategoryName(parentCategory);
    if (parentName !== 'unknown') {
      hierarchy.push(parentName);
    }
  }

  // Add the category itself
  const name = getCategoryName(category);
  if (name !== 'unknown') {
    hierarchy.push(name);
  }

  return hierarchy;
}
