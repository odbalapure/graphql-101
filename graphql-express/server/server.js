import cors from 'cors';
import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';

import { authMiddleware, handleLogin } from './auth.js';
import { readFile } from 'node:fs/promises';
import { resolvers } from './resolvers.js';
import { getUser } from './db/users.js';

const PORT = 9000;

const app = express();
app.use(cors(), express.json(), authMiddleware);

app.post('/login', handleLogin);

// Start the Appollo Server
const typeDefs = await readFile('./schema.graphql', 'utf8')
const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();

const getContext = async ({ req }) => {
  if (req.auth) {
    const user = await getUser(req.auth.sub);
    // Make sure to return the response as a key-value pair
    // where the key is "user" so that it can be accessed in resolvers
    // So that it can accessed in resolvers as "context.user"
    return { user };
  }
  return {};
}

// Use express middleware to handle GraphQL requests
// The "express-jwt" middleware will set a "req.auth" property
// The Apollo server will let us access the request context, i.e., the "req" object
app.use('/graphql', expressMiddleware(apolloServer, { context: getContext }));

// Start express server
app.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
});
