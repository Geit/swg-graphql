import { Field, Int, InterfaceType, ObjectType } from 'type-graphql';

import { IServerObject } from './ServerObject';

@InterfaceType({
  description: 'An object that cannot exist in the world, it is purely virtual.',
  resolveType: value => value.constructor.name,
  implements: IServerObject,
})
export class IIntangibleObject extends IServerObject {
  @Field(() => Int, { nullable: true, description: 'The maximum hitpoints this object has' })
  count: number | null;
}

@ObjectType({ implements: [IIntangibleObject, IServerObject] })
export class IntangibleObject extends IIntangibleObject {}
