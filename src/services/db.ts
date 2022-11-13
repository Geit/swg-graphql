import knex from 'knex';

import {
  ORA_CONN_STRING,
  ORA_DATABASE,
  ORA_DOMAIN,
  ORA_HOST,
  ORA_PASS,
  ORA_USER,
  ENABLE_SEPERATE_LOGIN_DB,
  ORA_LOGIN_CONN_STRING,
  ORA_LOGIN_DATABASE,
  ORA_LOGIN_DOMAIN,
  ORA_LOGIN_HOST,
  ORA_LOGIN_PASS,
  ORA_LOGIN_USER,
} from '../config';

/**
 * Creates a simple Knex object connected to our Oracle DB.
 */
const defaultDbConnector = knex({
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

export const loginDb = ENABLE_SEPERATE_LOGIN_DB
  ? knex({
      client: 'oracledb',
      connection: {
        host: ORA_LOGIN_HOST,
        user: ORA_LOGIN_USER,
        password: ORA_LOGIN_PASS,
        database: ORA_LOGIN_DATABASE,
        domain: ORA_LOGIN_DOMAIN,
        connectionString: ORA_LOGIN_CONN_STRING,
      },
    })
  : defaultDbConnector;

export default defaultDbConnector;
