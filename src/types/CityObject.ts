import { ObjectType } from 'type-graphql';

import { IServerObject, IUniverseObject } from '.';

@ObjectType({ implements: [IUniverseObject, IServerObject] })
export class CityObject extends IUniverseObject {}
