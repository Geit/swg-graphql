import { Field, InterfaceType, ID, Float, Int, ObjectType } from 'type-graphql';

import { ObjVarUnion } from './ObjVar';
import { PropertyListEntry } from './PropertyList';

export type Location = [x: number, y: number, z: number];
export type LocationXZ = [x: number, z: number];

@InterfaceType({
  description: 'Basic object which all other objects tend to inherit from.',
  resolveType: value => value.constructor.name,
})
export class IServerObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String, {
    description: 'The current name of this Object, may be null if this is using a localised/template name.',
    nullable: true,
  })
  name: string | null;

  @Field(() => [Float], { description: 'Location where the object was last seen or saved', nullable: true })
  location: Location | null;

  @Field(() => [Float], { description: "Quaternion describing the object's rotation", nullable: true })
  rotation: [w: number, x: number, y: number, z: number];

  @Field(() => [Float], { description: 'The snapshot node that this item should be loaded with', nullable: true })
  nodeLocation: Location | null;

  @Field(() => Int, { description: 'The Game Object Type ID of the object.', nullable: true })
  typeId: number | null;

  @Field(() => String, { description: 'The planet/scene where the item was last seen.', nullable: false })
  scene: string;

  @Field(() => Int, { description: 'The ID of the Object Controller responsible for this object.', nullable: true })
  controllerType: number | null;

  @Field(() => Int, {
    description: 'If non-null and non-zero, the ID of the deletion reason for this item',
    nullable: true,
  })
  deletionReason: number | null;

  @Field(() => String, {
    description: 'If non-null, the timestamp at which this object was deleted.',
    nullable: true,
  })
  deletionDate: string | null;

  @Field(() => Int, { description: 'If non-null, the date this item was deleted', nullable: true })
  volume: number | null;

  @Field(() => ID, { description: 'The OID of the object that currently contains this object.', nullable: true })
  containedById: string | null;

  @Field(() => Int, { description: 'The identifier of the slot arrangement for this object', nullable: true })
  slotArrangement: number | null;

  @Field({ description: 'Boolean indicating whether this object is controlled by a player' })
  playerControlled: boolean;

  @Field(() => Int)
  cacheVersion: number | null;

  @Field({
    description: 'Boolean indicating whether this object should load its contents immediately when it is loaded',
  })
  loadContents: boolean;

  @Field(() => Int, {
    description: 'The amount of credits on the object',
    nullable: true,
  })
  cashBalance: number | null;

  @Field(() => Int, {
    description: "The amount of credits in the object's bank account",
    nullable: true,
  })
  bankBalance: number | null;

  @Field(() => Int, {
    description: 'The crafting complexity of this object(??)',
    nullable: true,
  })
  complexity: number | null;

  @Field(() => String, { nullable: true })
  nameStringTable: string | null;

  @Field(() => String, { nullable: true })
  nameStringText: string | null;

  @Field(() => Int, { nullable: false })
  templateId: number;

  @Field(() => String, { nullable: true })
  staticItemName: string;

  @Field(() => Int)
  staticItemVersion: number | null;

  @Field(() => Int)
  conversionId: number | null;

  @Field(() => ID, {
    nullable: true,
    description: 'Object ID that this object should be loaded into the game server with',
  })
  loadWithId: string | null;

  @Field(() => [String], { description: 'A list of scripts current attached to the object.', nullable: true })
  scriptList: string[] | null;

  @Field(() => [ObjVarUnion], { description: 'Object variables on the object', nullable: true })
  objVars: typeof ObjVarUnion[];

  @Field(() => [IServerObject], { description: 'The contents of this object', nullable: true })
  contents: IServerObject[];

  @Field(() => String, {
    description: "Computed property respresenting the object's actual name",
  })
  resolvedName: string;

  @Field(() => Int, {
    description: 'Computed property representing the number of items stored within this item',
  })
  containedItemCount: number;

  @Field(() => [PropertyListEntry], {
    description: 'Property List values for an object',
    nullable: true,
  })
  propertyLists: PropertyListEntry[] | null;
}

@ObjectType({ implements: IServerObject })
export class ServerObject extends IServerObject {}

export type UnenrichedServerObject = Omit<IServerObject, 'objVars' | 'contents'>;
