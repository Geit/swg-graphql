import { BaseContext, ContextFunction } from '@apollo/server';
import { ExpressContextFunctionArgument } from '@as-integrations/express4';

export interface ContextType extends BaseContext {
  isAuthenticated: boolean;
  roles?: Set<string>;
}

export type SWGGraphqlContextFunction = ContextFunction<[ExpressContextFunctionArgument], ContextType>;
