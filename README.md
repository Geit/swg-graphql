# SWG GraphQL
Simple GraphQL Server for viewing and interacting with a [SWG-Source](https://github.com/SWG-Source/swg-main) Database. Used as the basis for SWG Legend's CSR Tool, it allows for building feature rich applications and tools for a live Star Wars Galaxies Server.

## Development
To bootstrap the project, you'll need a recent version of Node & Yarn v1 installed.

To install Node dependencies, simply run `yarn`.

You'll also need to follow the instructions for the installation of an OracleDB Client, which can be found here: http://oracle.github.io/node-oracledb/INSTALL.html#instructions


When all dependencies are installed, you can run the following commands in the project folder:

### `yarn start-dev`
Starts the GraphQL Server in development mode, automatically restarting when any of the underlying files are changed.

The [GraphQL Playground](https://github.com/graphql/graphql-playground) will be available at http://localhost:4000 by default.

### `yarn build-dist`
Compiles the Typescript down to JS and then uses @vercel/pkg to build a single executable, which is output in the `dist/` folder.
