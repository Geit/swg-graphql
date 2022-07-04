import 'reflect-metadata';
import { createServer } from 'http';
import { randomBytes } from 'crypto';

import express from 'express';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import { execute, subscribe } from 'graphql';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import cors from 'cors';
import { ApolloServerPluginInlineTrace, ContextFunction } from 'apollo-server-core';

import { PORT, DISABLE_AUTH } from './config';
import { kibanaAuthorisationContext, checkKibanaToken } from './context/kibana-auth';
import { apiKeyAuth } from './context/api-key-auth';
import { startIndexer } from './elasticSearchIndex/searchIndexer';

interface WebSocketConnectionParameters {
  authToken?: string;
}

interface WebSocketContext {
  authToken: string;
}

const serverContext: ContextFunction = async params => {
  if (typeof params.req.headers.authorization === 'string' && params.req.headers.authorization.startsWith('ApiKey-')) {
    await apiKeyAuth(params);
  } else {
    await kibanaAuthorisationContext(params);
  }
};

async function bootstrap() {
  const app = express();
  const websocketAuthTokens = new Set();

  app.post('/websocket_auth', async (req, res) => {
    if (!req.headers.authorization) {
      // eslint-disable-next-line no-param-reassign
      res.statusCode = 404;
      return res.end();
    }

    await checkKibanaToken(req.headers.authorization);

    const authToken = randomBytes(32).toString('hex');
    websocketAuthTokens.add(authToken);

    res.send(`{ "authToken": "${authToken}" }`);
  });

  app.use(
    cors({
      origin: process.env.NODE_ENV !== 'production',
      maxAge: 60 * 60,
    })
  );

  const httpServer = createServer(app);

  // Build the schema by pulling in all the resolvers from the resolvers folder
  const schema = await buildSchema({
    resolvers: [`${__dirname}/resolvers/*.{js,ts}`],
    container: Container,
  });

  // Create the GraphQL server
  const server = new ApolloServer({
    schema,
    context: serverContext,
    plugins: [ApolloServerPluginInlineTrace()],
  });

  await server.start();

  server.applyMiddleware({ app });

  SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect(connectionParams: WebSocketConnectionParameters, _socket: unknown, context: WebSocketContext) {
        if (DISABLE_AUTH) return;

        if (!('authToken' in connectionParams) || !connectionParams.authToken) {
          throw new AuthenticationError('Missing auth token!');
        }

        if (!websocketAuthTokens.has(connectionParams.authToken)) {
          throw new AuthenticationError('Not authorised to use websockets!');
        }

        // eslint-disable-next-line no-param-reassign
        context.authToken = connectionParams.authToken;
      },
      onDisconnect(_socket: unknown, context: WebSocketContext) {
        websocketAuthTokens.delete(context.authToken);
      },
    },
    { server: httpServer, path: server.graphqlPath }
  );

  // Start the server on the port specified in the config.
  httpServer.listen(PORT, () => console.log(`Server is now running on http://localhost:${PORT}/graphql`));

  startIndexer()
    .then(() => {
      console.log('Search indexer started');

      return undefined;
    })
    .catch(err => {
      console.error('Search indexer failed to start with error ', err);
    });
}

bootstrap();
