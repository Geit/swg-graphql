import { createUnionType, Field, Int, ObjectType } from 'type-graphql';

import { PlayerCreatureObject } from './PlayerCreatureObject';
import { UnenrichedServerObject } from './ServerObject';

import { Account, TAG_TO_TYPE_MAP, UnenrichedAccount } from '.';

export const SearchResultUnion: UnenrichedServerObject | UnenrichedAccount = createUnionType({
  name: 'SearchResult',
  types: () => [Account, PlayerCreatureObject, ...Object.values(TAG_TO_TYPE_MAP)] as const,
  resolveType: value => value.constructor.name,
});

@ObjectType()
export class SearchResultDetails {
  @Field(() => Int, { description: 'Estimated number of results found for this search' })
  totalResultCount: number;

  @Field(() => [SearchResultUnion], { description: 'Results in this page', nullable: true })
  results: typeof SearchResultUnion[] | null;
}
