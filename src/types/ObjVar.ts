import { Field, ObjectType, ID, Int, Float, createUnionType } from 'type-graphql';

export enum DynamicVariableType {
  INT,
  INT_ARRAY,
  REAL,
  REAL_ARRAY,
  STRING,
  STRING_ARRAY,
  NETWORK_ID,
  NETWORK_ID_ARRAY,
  LOCATION,
  LOCATION_ARRAY,
  LIST,
  STRING_ID,
  STRING_ID_ARRAY,
  TRANSFORM,
  TRANSFORM_ARRAY,
  VECTOR,
  VECTOR_ARRAY,
}

@ObjectType()
class ObjVarString {
  value: string;

  @Field(() => ID)
  name!: string;

  @Field()
  type!: number;

  @Field()
  get strValue(): string {
    return this.value;
  }
}

@ObjectType()
class ObjVarStringArray {
  value: string[];

  @Field(() => ID)
  name!: string;

  @Field()
  type!: number;

  @Field(() => [String])
  get strValues(): string[] {
    return this.value;
  }
}

@ObjectType()
class ObjVarInt {
  value: number;

  @Field(() => ID)
  name!: string;

  @Field()
  type!: number;

  @Field(() => Int)
  get intValue(): number {
    return this.value;
  }
}

@ObjectType()
class ObjVarIntArray {
  value: number[];

  @Field(() => ID)
  name!: string;

  @Field()
  type!: number;

  @Field(() => [Int])
  get intValues(): number[] {
    return this.value;
  }
}

@ObjectType()
class ObjVarFloat {
  value: number;

  @Field(() => ID)
  name!: string;

  @Field()
  type!: number;

  @Field(() => Float)
  get floatValue(): number {
    return this.value;
  }
}

@ObjectType()
class ObjVarFloatArray {
  value: number[];

  @Field(() => ID)
  name!: string;

  @Field()
  type!: number;

  @Field(() => [Float])
  get floatValues(): number[] {
    return this.value;
  }
}

export const ObjVarUnion = createUnionType({
  name: 'ObjVarUnion',
  types: () => [ObjVarString, ObjVarStringArray, ObjVarInt, ObjVarFloat, ObjVarIntArray, ObjVarFloatArray] as const,
  resolveType: value => {
    if ('type' in value) {
      switch (value.type) {
        case DynamicVariableType.INT:
          return ObjVarInt;
        case DynamicVariableType.INT_ARRAY:
          return ObjVarIntArray;
        case DynamicVariableType.REAL:
          return ObjVarFloat;
        case DynamicVariableType.REAL_ARRAY:
          return ObjVarFloatArray;
        case DynamicVariableType.NETWORK_ID_ARRAY:
        case DynamicVariableType.STRING_ARRAY:
          return ObjVarStringArray;
        default:
          return ObjVarString;
      }
    }
    return undefined;
  },
});
