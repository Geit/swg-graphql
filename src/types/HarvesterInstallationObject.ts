import { Field, Int, ObjectType, Float, ID } from 'type-graphql';

import { IInstallationObject } from './InstallationObject';
import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

@ObjectType({ implements: [IInstallationObject, ITangibleObject, IServerObject] })
export class HarvesterInstallationObject extends ITangibleObject {
  @Field(() => Float, {
    nullable: true,
    description: 'The "strength" of the resource that the harvester is currently placed on top of.',
  })
  installedEfficiency: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The maximum rated extraction rate, in units/hr, that the harvester can withdraw from a resource pool',
  })
  maxExtractionRate: number | null;

  @Field(() => Float, {
    nullable: true,
    description:
      'The extraction rate, in units/hr, that the harvester is extracting from the resource pool it is placed on ',
  })
  currentExtractionRate: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The maximum amount of a resource that can be kept in the harvester before it is full',
  })
  maxHopperAmount: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The ID of the resource pool that this harvester is currently extracting from',
  })
  hopperResource: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'The amount of the current resource that is in the hopper and ready to be withdrawn',
  })
  hopperAmount: number | null;

  @Field(() => ID, {
    nullable: true,
    description: 'The type/class(?) of the resource that can be extracted by this harvester',
  })
  resourceType: string | null;
}
