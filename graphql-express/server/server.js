import cors from 'cors';
import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';

import { authMiddleware, handleLogin } from './auth.js';
import { readFile } from 'node:fs/promises';
import { resolvers } from './resolvers.js';

const PORT = 9000;

const app = express();
app.use(cors(), express.json(), authMiddleware);

app.post('/login', handleLogin);

// Start the Appollo Server
const typeDefs = await readFile('./schema.graphql', 'utf8')
const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();

const getContext = ({ req }) => {
  return { auth: req.auth };
}

// Use express middleware to handle GraphQL requests
app.use('/graphql', expressMiddleware(apolloServer, { context: getContext }));

// Start express server
app.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
});
