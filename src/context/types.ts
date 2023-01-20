import { BaseContext, ContextFunction } from '@apollo/server';
import { ExpressContextFunctionArgument } from '@apollo/server/express4';

export type ContextType = BaseContext;

export type SWGGraphqlContextFunction = ContextFunction<[ExpressContextFunctionArgument], ContextType>;
