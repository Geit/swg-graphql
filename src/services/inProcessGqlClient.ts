import { execute, type GraphQLSchema } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

import { ALL_PERMISSIONS } from '@core/auth';
import type { ContextType } from '@core/context/types';

let schema: GraphQLSchema | null = null;
let resolveSchemaReady!: (s: GraphQLSchema) => void;
const schemaReady = new Promise<GraphQLSchema>(resolve => {
  resolveSchemaReady = resolve;
});

export const setInProcessGqlSchema = (built: GraphQLSchema): void => {
  schema = built;
  resolveSchemaReady(built);
};

const SYSTEM_CONTEXT: ContextType = {
  isAuthenticated: true,
  permissions: new Set(ALL_PERMISSIONS),
};

export async function runQuery<TData, TVariables>(
  document: TypedDocumentNode<TData, TVariables>,
  variables: TVariables
): Promise<TData> {
  const activeSchema = schema ?? (await schemaReady);

  const result = await execute({
    schema: activeSchema,
    document,
    variableValues: variables as Record<string, unknown>,
    contextValue: SYSTEM_CONTEXT,
  });

  if (result.errors && result.errors.length > 0) {
    const [first, ...rest] = result.errors;
    if (rest.length === 0) throw first;
    throw new AggregateError(result.errors, 'In-process GraphQL request failed');
  }

  return result.data as TData;
}
