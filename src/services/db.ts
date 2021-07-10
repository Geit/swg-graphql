import knex from 'knex';

import { ORA_CONN_STRING, ORA_DATABASE, ORA_DOMAIN, ORA_HOST, ORA_PASS, ORA_USER } from '../config';

/**
 * Creates a simple Knex object connected to our Oracle DB.
 */
export default knex({
  client: 'oracledb',
  connection: {
    host: ORA_HOST,
    user: ORA_USER,
    password: ORA_PASS,
    database: ORA_DATABASE,
    domain: ORA_DOMAIN,
    connectionString: ORA_CONN_STRING,
  },
});
