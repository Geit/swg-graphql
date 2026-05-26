import { Router } from 'express';
import { Queue } from 'bullmq';
import { NonEmptyArray } from 'type-graphql';

import { AuthContribution } from './auth/registry';

export interface ModuleExports {
  moduleName: string;

  /**
   * Resolvers to add to the root GraphQL Server.
   *
   * May be provided as either an Array of resolver classes, or an array of strings representing
   * the absolute file location of any modules containing resolvers.
   */

  resolvers?: NonEmptyArray<string>;

  /**
   * Routers to mount on the app. All routers will be subject to AuthN.
   */
  routes?: Router[];

  /**
   * Queues that the module manages. These will be exposed in the admin interface.
   */
  queues?: Queue[];

  /**
   * Permissions, role-bundle additions, and Kibana privilege mappings this module owns. Merged
   * into the global auth registry at boot.
   */
  auth?: AuthContribution;

  /**
   * Called on SIGTERM/SIGINT to gracefully shut down workers and close connections.
   */
  shutdown?: () => Promise<void>;
}

export type Module = () => ModuleExports | Promise<ModuleExports | null> | null;
