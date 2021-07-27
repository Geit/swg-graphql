import 'reflect-metadata';
import { createServer } from 'http';

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
      async onConnect(connectionParams: any) {
        if (DISABLE_AUTH) return;

        if (!connectionParams.authToken) {
          throw new AuthenticationError('Missing auth token!');
        }

        await checkKibanaToken(connectionParams.authToken);
      },
    },
    { server: httpServer, path: server.graphqlPath }
  );

  // Start the server on the port specified in the config.
  httpServer.listen(PORT, () => console.log(`Server is now running on http://localhost:${PORT}/graphql`));
}

bootstrap();
