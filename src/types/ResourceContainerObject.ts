import { Field, ID, Int, ObjectType } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class ResourceContainerObject extends ITangibleObject {
  @Field(() => ID, { nullable: true, description: 'The Resource ID of the resource being contained' })
  resourceType: string | null;

  @Field(() => Int, { nullable: true, description: 'The amount of the resource that this container currently has' })
  quantity: number | null;

  @Field(() => ID, { nullable: true, description: 'The object ID that generated this resource.' })
  source: string | null;
}
