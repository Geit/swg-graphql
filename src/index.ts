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

import { PORT, DISABLE_AUTH } from './config';
import { kibanaAuthorisationContext, checkKibanaToken } from './context/kibana-auth';

async function bootstrap() {
  const app = express();
  const websocketAuthTokens = new Set();

  app.post('/websocket_auth', async (req, res) => {
    if (!req.headers.authorization) {
      // eslint-disable-next-line no-param-reassign
      res.statusCode = 404;
      res.end();
    }

    await checkKibanaToken(req.headers.authorization!);

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
    context: !DISABLE_AUTH ? kibanaAuthorisationContext : undefined,
  });

  await server.start();

  server.applyMiddleware({ app });

  SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect(connectionParams: any, _socket: any, context: any) {
        if (DISABLE_AUTH) return;

        if (!connectionParams.authToken) {
          throw new AuthenticationError('Missing auth token!');
        }

        if (!websocketAuthTokens.has(connectionParams.authToken)) {
          throw new AuthenticationError('Not authorised to use websockets!');
        }

        // eslint-disable-next-line no-param-reassign
        context.authToken = connectionParams.authToken;
      },
      onDisconnect(_socket: any, context: any) {
        websocketAuthTokens.delete(context.authToken);
      },
    },
    { server: httpServer, path: server.graphqlPath }
  );

  // Start the server on the port specified in the config.
  httpServer.listen(PORT, () => console.log(`Server is now running on http://localhost:${PORT}/graphql`));
}

bootstrap();
