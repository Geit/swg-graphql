import 'reflect-metadata';
import { createServer } from 'http';
import { randomBytes } from 'crypto';

import express from 'express';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { execute, GraphQLError, subscribe } from 'graphql';
import { buildSchema, NonEmptyArray } from 'type-graphql';
import { Container } from 'typedi';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import cors from 'cors';
import { json } from 'body-parser';
import { ExpressAdapter, createBullBoard, BullMQAdapter } from '@bull-board/express';

import { PORT, DISABLE_AUTH } from './config';
import { checkKibanaToken } from './context/kibana-auth';
import { startModule as startGalaxySearchModule } from './modules/galaxySearch';
import { startModule as startTransactionsModule } from './modules/transactions';
import { ContextType } from './context/types';
import { getRequestContext } from './context';

const GQL_PATH = '/graphql' as const;

interface WebSocketConnectionParameters {
  authToken?: string;
}

interface WebSocketContext {
  authToken: string;
}

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);
  const { queues, resolvers: galaxySearchResolvers } = await startGalaxySearchModule();
  const { resolvers: transactionResolvers } = startTransactionsModule();
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
  app.use(json({ limit: '1MB' }));

  const bullExpressAdapter = new ExpressAdapter();
  bullExpressAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: queues.map(q => new BullMQAdapter(q)),
    serverAdapter: bullExpressAdapter,
  });

  app.use('/admin/queues', bullExpressAdapter.getRouter());

  // Build the schema by pulling in all the resolvers from the resolvers folder
  const resolvers: NonEmptyArray<string> = [
    `${__dirname}/resolvers/*.{js,ts}`,
    ...galaxySearchResolvers,
    ...transactionResolvers,
  ];

  const schema = await buildSchema({
    resolvers,
    container: Container,
  });

  // Create the GraphQL server
  const server = new ApolloServer<ContextType>({
    schema,
    plugins: [ApolloServerPluginInlineTrace(), ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    GQL_PATH,
    expressMiddleware(server, {
      context: getRequestContext,
    })
  );

  SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect(connectionParams: WebSocketConnectionParameters, _socket: unknown, context: WebSocketContext) {
        if (DISABLE_AUTH) return;

        if (!('authToken' in connectionParams) || !connectionParams.authToken) {
          throw new GraphQLError('Missing auth token!', {
            extensions: {
              code: 'FORBIDDEN',
              myExtension: 'swg-graphql-websockets',
            },
          });
        }

        if (!websocketAuthTokens.has(connectionParams.authToken)) {
          throw new GraphQLError('Not authorised to use websockets!', {
            extensions: {
              code: 'FORBIDDEN',
              myExtension: 'swg-graphql-websockets',
            },
          });
        }

        // eslint-disable-next-line no-param-reassign
        context.authToken = connectionParams.authToken;
      },
      onDisconnect(_socket: unknown, context: WebSocketContext) {
        websocketAuthTokens.delete(context.authToken);
      },
    },
    { server: httpServer, path: GQL_PATH }
  );

  // Start the server on the port specified in the config.
  httpServer.listen(PORT, () => console.log(`Server is now running on http://localhost:${PORT}${GQL_PATH}`));
}

bootstrap();
