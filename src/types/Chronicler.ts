import { Field, ID, Int, ObjectType } from 'type-graphql';

@ObjectType({
  description:
    "A Chronicle Master's aggregate stats, decoded from a `v3:` chronicler record packed into the city object's Citizens (LIST_ID 13) property list. One entry per chronicler; unranked.",
})
export class ChroniclerStats {
  @Field(() => String, {
    description: 'Chronicler name as recorded; durable (survives rename/deletion), unlike the live `character` node.',
  })
  name: string;

  @Field(() => ID, {
    nullable: true,
    description: "The chronicler character's object id: node reference for the `character` resolver and deep-links.",
  })
  characterOid: string | null;

  @Field(() => Int, { description: 'Gold-quality player quests this chronicler has created.' })
  questsCreated: number;

  @Field(() => Int, { description: 'Gold-quality player quests this chronicler has completed.' })
  questsCompleted: number;

  @Field(() => Int, { description: 'Number of ratings received (the rating-average denominator).' })
  ratingCount: number;

  @Field(() => Int, { description: 'Sum of rating values received (the rating-average numerator).' })
  ratingTotal: number;

  @Field(() => Int, {
    description: "Count of this chronicler's rated quests, feeding the rating board's volume bonus.",
  })
  ratedQuestCount: number;
}
