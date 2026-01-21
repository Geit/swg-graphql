import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType({ description: 'A market category based on Game Object Type' })
export class MarketCategory {
  @Field(() => Int, { description: 'The category ID (Game Object Type value)' })
  id: number;

  @Field(() => String, { description: 'The category name (e.g., "armor_body")' })
  name: string;

  @Field(() => String, { description: 'Human-readable display name' })
  displayName: string;

  @Field(() => Int, { nullable: true, description: 'Parent category ID if this is a subcategory' })
  parentId: number | null;

  @Field(() => String, { nullable: true, description: 'Parent category name if this is a subcategory' })
  parentName: string | null;

  @Field(() => Boolean, { description: 'Whether this is a subcategory' })
  isSubCategory: boolean;
}
