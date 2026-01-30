import knex from 'knex';
import { MockClient, createTracker } from 'knex-mock-client';

const mockDb = knex({ client: MockClient });
const tracker = createTracker(mockDb);

export { tracker };
export const loginDb = mockDb;
export default mockDb;
