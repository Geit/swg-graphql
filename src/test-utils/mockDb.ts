/**
 * Knex Mock Database Utilities
 *
 * Uses knex-mock-client with Vitest's automatic mocking via __mocks__ directory.
 *
 * @example Usage in a test file:
 * ```ts
 * import { describe, it, expect, vi, beforeEach } from 'vitest';
 *
 * import { MyService } from './MyService';
 * import { tracker } from './__mocks__/db';
 *
 * vi.mock('./db');
 *
 * describe('MyService', () => {
 *   beforeEach(() => {
 *     tracker.reset();
 *   });
 *
 *   it('should query data', async () => {
 *     tracker.on.select('MY_TABLE').response([{ id: 1, name: 'Test' }]);
 *
 *     const result = await service.getAll();
 *     expect(result).toHaveLength(1);
 *   });
 * });
 * ```
 *
 * The mock is defined in src/services/__mocks__/db.ts and exports:
 * - default: the mock knex instance
 * - loginDb: same mock instance for login database
 * - tracker: the query tracker for setting up responses
 *
 * @see https://github.com/felixmosh/knex-mock-client for full documentation
 */

export { Tracker } from 'knex-mock-client';
