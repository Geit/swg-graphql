// Property lists are tuples of data comprised of (object, list_id, value)
// This data is then transformed within the game into an array of strings for each list_id
// Property lists are currently unimplemented, but they aren't complicated and should be coming soon!

import { Field, ObjectType, registerEnumType } from 'type-graphql';

export enum PropertyListIds {
  Commands = 0,
  DraftSchematics = 1,
  // removed: PvpEnemies=2,
  Allowed = 3,
  Banned = 4,
  GuildNames = 5,
  GuildAbbrevs = 6,
  GuildMembers = 7,
  GuildEnemies = 8,
  GuildLeaders = 10,
  Skills = 11,
  Cities = 12,
  Citizens = 13,
  CityStructures = 14,
}

registerEnumType(PropertyListIds, {
  name: 'PropertyListIds',
  description: 'SWG Property List IDs',
});

@ObjectType()
export class PropertyListEntry {
  @Field(() => PropertyListIds, { description: 'List ID for the property list entry' })
  listId: PropertyListIds;

  @Field(() => String, { description: 'Value stored within this property list entry', nullable: true })
  value: string;
}
