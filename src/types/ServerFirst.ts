import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType({
  description:
    'A server-first collection completion: the first character on the galaxy to finish a given Collection. Sourced from the collectionServerFirst.* objvars on the Tatooine planet object.',
})
export class ServerFirst {
  @Field(() => String, {
    description:
      'Internal collection name: the objvar slot under collectionServerFirst.* and the collection.iff row name.',
  })
  collectionName: string;

  @Field(() => String, {
    nullable: true,
    description:
      'Localized collection display name (from collection.iff string_name via STF), or null when the name is unmapped.',
  })
  displayName: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Collection category/book this collection belongs to (collection.iff), or null.',
  })
  category: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Character name recorded at completion. Durable (survives a later rename/deletion), unlike `character`; null when none was recorded.',
  })
  characterName: string | null;

  @Field(() => ID, {
    nullable: true,
    description:
      "The first character's object id: the node reference for the `character` field resolver and for deep-links.",
  })
  characterOid: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'ISO-8601 completion time, when the objvar records one.',
  })
  dateCompleted: string | null;
}
