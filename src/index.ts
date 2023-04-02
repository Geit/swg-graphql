import 'reflect-metadata';
import { createServer } from 'http';
import { randomBytes } from 'crypto';

import express, { ErrorRequestHandler } from 'express';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLError } from 'graphql';
import { buildSchema, NonEmptyArray } from 'type-graphql';
import { Container } from 'typedi';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import { json } from 'body-parser';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { mergeWith } from 'lodash';
import { ZodError } from 'zod';
import 'express-async-errors';

import { PORT, DISABLE_AUTH } from './config';
import { checkKibanaToken } from './context/kibana-auth';
import { galaxySearchModule } from './modules/galaxySearch';
import { transactionsModule } from './modules/transactions';
import { loginsModule } from './modules/legends_logins';
import { ContextType } from './context/types';
import { getRequestContext } from './context';
import { Module, ModuleExports } from './moduleTypes';
import { isPresent } from './utils/utility-types';
import { customAuthChecker } from './auth';

const GQL_PATH = '/graphql' as const;

function concatIfArray<T>(objValue: T, srcValue: T) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

const modules: Module[] = [galaxySearchModule, transactionsModule, loginsModule];

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);

  const websocketAuthTokens = new Set();

  app.post('/websocket_auth', async (req, res) => {
    if (!req.headers.authorization) {
      console.log('No auth header on /websocket_auth, 404ing');
      return res.status(401).end();
    }

    await checkKibanaToken(req.headers.authorization);

    const authToken = randomBytes(32).toString('hex');
    websocketAuthTokens.add(authToken);

    console.log('Auth token added to GQL Memory');

    res.json({ authToken });
  });

  app.use(
    cors({
      origin: process.env.NODE_ENV !== 'production',
      maxAge: 60 * 60,
    })
  );
  app.use(json({ limit: '1MB' }));

  const moduleResults = await Promise.all(modules.map(m => m()));
  const validModules = moduleResults.filter(isPresent);
  const {
    queues: moduleQueues,
    resolvers: moduleResolvers,
    routes: moduleRouters,
  } = validModules.reduce((acc, cur) => {
    return mergeWith(acc, cur, concatIfArray);
  }, {} as ModuleExports);

  if (moduleQueues) {
    const bullExpressAdapter = new ExpressAdapter();
    bullExpressAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: moduleQueues.map(q => new BullMQAdapter(q)),
      serverAdapter: bullExpressAdapter,
    });
    app.use('/admin/queues', bullExpressAdapter.getRouter());
  }

  // Build the schema by pulling in all the resolvers from the resolvers folder
  const resolvers: NonEmptyArray<string> = [
    `${__dirname}/resolvers/*.{js,ts}`,
    ...(moduleResolvers?.flatMap(mr => mr) ?? []),
  ];

  const schema = await buildSchema({
    resolvers,
    container: Container,
    authChecker: customAuthChecker,
  });

  // Create the GraphQL server
  const server = new ApolloServer<ContextType>({
    schema,
    plugins: [
      ApolloServerPluginInlineTrace(),
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        // eslint-disable-next-line require-await
        async serverWillStart() {
          return {
            async drainServer() {
              await websocketServer.dispose();
            },
          };
        },
      },
      ApolloServerPluginLandingPageLocalDefault({
        includeCookies: true,
        embed: true,
      }),
    ],
  });

  await server.start();

  app.use(
    GQL_PATH,
    expressMiddleware(server, {
      context: getRequestContext,
    })
  );

  app.use(async (req, res, next) => {
    try {
      await getRequestContext({ req, res });
    } catch (err) {
      if (err instanceof GraphQLError) {
        res.status(403);
        return next(err.message);
      }

      return next(err);
    }
    return next();
  });

  for (const router of moduleRouters ?? []) {
    app.use(router);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
      const message = err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n');

      res.status(400).json({
        message,
      });
      return;
    }
    const { status } = err;

    console.error(err);
    res.status(status || 500).json({
      message: 'Unexpected server error',
    });
  };

  app.use(errorHandler);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: GQL_PATH,
  });

  // Passing in an instance of a GraphQLSchema and
  // telling the WebSocketServer to start listening
  const websocketServer = useServer<{ authToken?: string }, { authToken: string }>(
    {
      schema,
      context: ctx => {
        if (DISABLE_AUTH) return;

        const { connectionParams } = ctx;

        if (!connectionParams || !('authToken' in connectionParams) || !connectionParams.authToken) {
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

        return { authToken: connectionParams.authToken };
      },
      onDisconnect(ctx) {
        if (ctx && 'authToken' in ctx) websocketAuthTokens.delete(ctx.authToken);
      },
    },
    wsServer
  );

  // Start the server on the port specified in the config.
  httpServer.listen(PORT, () => console.log(`Server is now running on http://localhost:${PORT}${GQL_PATH}`));
}

bootstrap();
