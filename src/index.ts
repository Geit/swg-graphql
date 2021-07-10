import 'reflect-metadata';
import { ApolloServer } from 'apollo-server';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';

import { DISABLE_PLAYGROUND, PORT, ENABLE_TRACING, DISABLE_AUTH } from './config';
import kibanaAuthorisationContext from './context/kibana-auth';

async function bootstrap() {
  // Build the schema by pulling in all the resolvers from the resolvers folder
  const schema = await buildSchema({
    resolvers: [`${__dirname}/resolvers/*.{ts}`],
    container: Container,
  });

  // Create the GraphQL server
  const server = new ApolloServer({
    schema,
    playground: !DISABLE_PLAYGROUND,
    tracing: ENABLE_TRACING,
    context: !DISABLE_AUTH ? kibanaAuthorisationContext : undefined,
  });

  // Start the server on the port specified in the config.
  const { url } = await server.listen(PORT);

  // eslint-disable-next-line no-console
  console.log(`Server is running, GraphQL Playground available at ${url}`);
}

bootstrap();
