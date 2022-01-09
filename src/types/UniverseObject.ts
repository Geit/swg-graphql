import { InterfaceType, ObjectType } from 'type-graphql';

import { IServerObject } from './ServerObject';

@InterfaceType({
  description:
    'A UniverseObject is an object that is global to the entire server cluster.  UniverseObjects represent global data (such as Resource Classes) or objects with no definite location (such as Resource Pools).',
  resolveType: value => value.constructor.name,
  implements: IServerObject,
})
export class IUniverseObject extends IServerObject {}

@ObjectType({ implements: [IUniverseObject, IServerObject] })
export class UniverseObject extends IServerObject {}
