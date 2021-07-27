# SWG GraphQL
Simple GraphQL Server for viewing and interacting with a [SWG-Source](https://github.com/SWG-Source/swg-main) Database. Used as the basis for SWG Legend's CSR Tool, it allows for building feature rich applications and tools for a live Star Wars Galaxies Server.

## Frontend
This project is sister to the Frontend CSR tool for Kibana, which you can find over at: [Geit/swg-csr-tool](https://github.com/Geit/swg-csr-tool)

## String Resolution
SWG GraphQL will attempt to read and parse `.stf` string tables within the `data/string/en/` folder. This is not included within the repository and should be populated using a full client extract from your server.

## Planet Watcher setup
Planet Server locations can be populated using the `data/planet-servers.json` file - using `data/planet-servers.example.json` as a template. This file will likely need updating every time your planet servers are started - how you source that information is (currently) heavily dependent on your deployment.

## Development
To bootstrap the project, you'll need a recent version of Node & Yarn v1 installed.

To install Node dependencies, simply run `yarn`.

You'll also need to follow the instructions for the installation of an OracleDB Client, which can be found here: http://oracle.github.io/node-oracledb/INSTALL.html#instructions


When all dependencies are installed, you can run the following commands in the project folder:

### `yarn start-dev`
Starts the GraphQL Server in development mode, automatically restarting when any of the underlying files are changed.

The [GraphQL Playground](https://github.com/graphql/graphql-playground) will be available at http://localhost:4000 by default.

See `./src/config.ts` for all environment variables used for configuration. As a bare minimum you will likely need to configure `ORA_HOST`.

If you do not wish to authorise with a Kibana server, run with  `DISABLE_AUTH=1 yarn start-dev`.

### `yarn build-dist`
Compiles the Typescript down to JS and then uses @vercel/pkg to build a single executable, which is output in the `dist/` folder.
