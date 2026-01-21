import { Field, Int, ObjectType, registerEnumType } from 'type-graphql';

export enum SearchAttributeDataType {
  INT = 'int',
  FLOAT = 'float',
  STRING = 'string',
  ENUM = 'enum',
}

registerEnumType(SearchAttributeDataType, {
  name: 'SearchAttributeDataType',
  description: 'The data type of a search attribute',
});

@ObjectType({ description: 'A possible value for an enum-type search attribute' })
export class SearchAttributeEnumValue {
  @Field(() => String, { description: 'The raw enum value' })
  name: string;

  @Field(() => String, { description: 'Human-readable display name' })
  displayName: string;
}

@ObjectType({ description: 'A searchable attribute for market listings' })
export class MarketSearchAttribute {
  @Field(() => String, { description: 'The attribute name (e.g., "@obj_attr_n:efficiency")' })
  name: string;

  @Field(() => String, { description: 'Normalized attribute name for ES queries (e.g., "obj_attr_n_efficiency")' })
  normalizedName: string;

  @Field(() => String, { description: 'Human-readable display name' })
  displayName: string;

  @Field(() => String, { description: 'The game object type this attribute belongs to' })
  gameObjectType: string;

  @Field(() => SearchAttributeDataType, { description: 'The data type of this attribute' })
  dataType: SearchAttributeDataType;

  @Field(() => [SearchAttributeEnumValue], { description: 'Possible values for enum-type attributes' })
  enumValues: SearchAttributeEnumValue[];
}

@ObjectType({ description: 'Paginated search result for market search attributes' })
export class MarketSearchAttributeSearchResult {
  @Field(() => Int)
  totalResults: number;

  @Field(() => [MarketSearchAttribute])
  results: MarketSearchAttribute[];
}
