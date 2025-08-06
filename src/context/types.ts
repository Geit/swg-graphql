import { BaseContext, ContextFunction } from '@apollo/server';
import { ExpressContextFunctionArgument } from '@as-integrations/express5';

export interface ContextType extends BaseContext {
  isAuthenticated: boolean;
  roles?: Set<string>;
}

export type SWGGraphqlContextFunction = ContextFunction<[ExpressContextFunctionArgument], ContextType>;
