import { createUnionType, Field, InputType, Int, ObjectType } from 'type-graphql';
import {
  PlayerCreatureObject,
  UnenrichedServerObject,
  Account,
  TAG_TO_TYPE_MAP,
  UnenrichedAccount,
  ResourceType,
} from '@core/types';

@InputType()
export class IntRangeInput {
  @Field()
  key: string;

  @Field(() => Int, { nullable: true })
  gte?: number;

  @Field(() => Int, { nullable: true })
  lte?: number;
}

@InputType()
export class DateRangeInput {
  @Field(() => String, { nullable: true })
  gte?: string;

  @Field(() => String, { nullable: true })
  lte?: string;
}

export const SearchResultUnion: UnenrichedServerObject | UnenrichedAccount | ResourceType = createUnionType({
  name: 'SearchResult',
  types: () => [Account, PlayerCreatureObject, ...Object.values(TAG_TO_TYPE_MAP), ResourceType] as const,
  resolveType: value => {
    if ('classId' in value) return 'ResourceType';
    return value.constructor.name;
  },
});

@ObjectType()
export class SearchResultDetails {
  @Field(() => Int, { description: 'Estimated number of results found for this search' })
  totalResultCount: number;

  @Field(() => [SearchResultUnion], { description: 'Results in this page', nullable: true })
  results: typeof SearchResultUnion[] | null;
}
