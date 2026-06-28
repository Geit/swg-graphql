import { Field, ID, Int, ObjectType } from 'type-graphql';

@ObjectType({
  description:
    "A Chronicle Master's aggregate stats, decoded from a `v3:` chronicler record in the city object's property list. One entry per chronicler; unranked.",
})
export class ChroniclerStats {
  @Field(() => String, {
    description: 'Chronicler name as recorded; durable (survives rename/deletion), unlike the live `character` node.',
  })
  name: string;

  @Field(() => ID, {
    nullable: true,
    description: "The chronicler character's object id; the node reference for the `character` resolver.",
  })
  characterOid: string | null;

  @Field(() => Int, { description: 'Stored Chronicle experience points.' })
  xp: number;

  @Field(() => Int, { description: 'Stored silver Chronicle tokens.' })
  silverTokens: number;

  @Field(() => Int, { description: 'Stored gold Chronicle tokens.' })
  goldTokens: number;

  @Field(() => Int, { description: 'Quality quests (quest weight >= 15) this chronicler has created.' })
  questsCreated: number;

  @Field(() => Int, { description: 'Quality quests (quest weight >= 15) this chronicler has completed as a player.' })
  questsCompleted: number;

  @Field(() => Int, { description: "Total times other players have completed this chronicler's quests." })
  questsPlayed: number;

  @Field(() => Int, { description: 'Number of ratings this chronicler has received.' })
  ratingCount: number;

  @Field(() => Int, { description: 'Sum of all rating values this chronicler has received.' })
  ratingTotal: number;

  @Field(() => Int, {
    description: "Quality completions (quest weight >= 15) of this chronicler's quests by other players.",
  })
  ratedQuestCount: number;
}
