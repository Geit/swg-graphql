import { BaseContext, ContextFunction } from '@apollo/server';
import { ExpressContextFunctionArgument } from '@as-integrations/express5';

import { Permission } from '@core/auth';

export interface ContextType extends BaseContext {
  isAuthenticated: boolean;
  permissions?: Set<Permission>;
}

export type SWGGraphqlContextFunction = ContextFunction<[ExpressContextFunctionArgument], ContextType>;
