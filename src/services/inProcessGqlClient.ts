import { execute, type GraphQLSchema } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

import { getAuthRegistry } from '@core/auth';
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

// Built lazily so module-contributed permissions registered via `installAuthRegistry` at boot
// are included — capturing this at module-load freezes it to the core-only set.
const buildSystemContext = (): ContextType => ({
  isAuthenticated: true,
  permissions: new Set(getAuthRegistry().allPermissions),
});

export async function runQuery<TData, TVariables>(
  document: TypedDocumentNode<TData, TVariables>,
  variables: TVariables
): Promise<TData> {
  const activeSchema = schema ?? (await schemaReady);

  const result = await execute({
    schema: activeSchema,
    document,
    variableValues: variables as Record<string, unknown>,
    contextValue: buildSystemContext(),
  });

  if (result.errors && result.errors.length > 0) {
    const [first, ...rest] = result.errors;
    if (rest.length === 0) throw first;
    throw new AggregateError(result.errors, 'In-process GraphQL request failed');
  }

  return result.data as TData;
}
