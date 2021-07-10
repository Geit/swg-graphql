import { Field, Int, ObjectType } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class CellObject extends ITangibleObject {
  @Field(() => Int, {
    nullable: true,
    description: 'The index of the Cell. Used to match up to the Portal Layout File by the client',
  })
  cellNumber: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Whether the cell is public. Ban/Access lists are stored as property lists within the object',
  })
  isPublic: boolean | null;
}
