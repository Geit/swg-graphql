import { execute, parse, type DocumentNode, type GraphQLSchema } from 'graphql';
import type { GraphQLClient } from 'graphql-request';

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

interface InProcessRequestOptions {
  document: DocumentNode | string;
  variables?: Record<string, unknown>;
}

const adapter = {
  async request<T>(options: InProcessRequestOptions): Promise<T> {
    const activeSchema = schema ?? (await schemaReady);
    const document = typeof options.document === 'string' ? parse(options.document) : options.document;

    const result = await execute({
      schema: activeSchema,
      document,
      variableValues: options.variables,
      contextValue: SYSTEM_CONTEXT,
    });

    if (result.errors && result.errors.length > 0) {
      const [first, ...rest] = result.errors;
      if (rest.length === 0) throw first;
      throw new AggregateError(result.errors, 'In-process GraphQL request failed');
    }

    return result.data as T;
  },
};

// The codegen-generated SDK only invokes `client.request({ document, variables })`,
// so duck-typing satisfies the full surface it uses without pulling in the HTTP client.
export const inProcessGqlClient = adapter as unknown as GraphQLClient;
