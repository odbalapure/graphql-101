## Starting a basic GraphQL server

```javascript
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `#graphql
    type Query {
        greeting: String
    }
`;

const resolvers = {
    Query: {
        greeting: () => 'Hello World!',
    }
}

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 9000 } });
console.log(`Server started at ${url}`);

```

NOTE: `@apollo/server` lets us create a stand alone server but it also provides an `express` middleware that lets us use GraphQL with an `express` server.