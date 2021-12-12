// Property lists are tuples of data comprised of (object, list_id, value)
// This data is then transformed within the game into an array of strings for each list_id
// Property lists are currently unimplemented, but they aren't complicated and should be coming soon!

export enum PropertyListIds {
  LI_Commands = 0,
  LI_DraftSchematics = 1,
  // removed: LI_PvpEnemies=2,
  LI_Allowed = 3,
  LI_Banned = 4,
  LI_GuildNames = 5,
  LI_GuildAbbrevs = 6,
  LI_GuildMembers = 7,
  LI_GuildEnemies = 8,
  LI_GuildLeaders = 10,
  LI_Skills = 11,
  LI_Cities = 12,
  LI_Citizens = 13,
  LI_CityStructures = 14,
}
