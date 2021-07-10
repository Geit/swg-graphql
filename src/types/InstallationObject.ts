import { Field, Int, ObjectType, Float, InterfaceType } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

@InterfaceType({
  description: 'An installation object.',
  resolveType: value => value.constructor.name,
  implements: [ITangibleObject, IServerObject],
})
export class IInstallationObject extends ITangibleObject {
  @Field(() => Int, { nullable: true, description: 'The type of the installation, i.e. factory or harvester' })
  installationType: number | null;

  @Field({ description: 'Whether this installation is currently activated' })
  activated: boolean;

  @Field(() => Float, { nullable: true, description: 'The number of ticks that this installation has completed(?)' })
  tickCount: number | null;

  @Field(() => Float, { nullable: true, description: "The 'game' time at which this installation was last activated" })
  activateStartTime: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'The amount of power that this installation has deposited within it',
  })
  power: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'The rate, in units/hr, at which this installation consumes power',
  })
  powerRate: number | null;
}

@ObjectType({ implements: [IInstallationObject, ITangibleObject, IServerObject] })
export class InstallationObject extends IInstallationObject {}
