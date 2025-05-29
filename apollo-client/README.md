## Apollo Client

```javascript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { GraphQLClient, gql } from 'graphql-request';
import { getAccessToken } from '../auth';

const apolloClient = new ApolloClient({
  uri: 'http://localhost:9000/graphql',
  // Cache data returned from the server "in memory"
  cache: new InMemoryCache()
});
```

NOTE:
- The @apollo/client `gql` is used to parse GraphQL query strings into an AST that Apollo Client can process. It integrates well with the Apollo's features like caching, state management etc.
- The graphql-request is more minimal and is a template literal tag used to define GraphQL queries, mutations or subscriptions in a format that it can send to a GraphQL server.

## Making requests

```javascript
// Query
const { data } = await apolloClient.query({ query });
const { data } = await apolloClient.query({ 
  query,
  variables: { id }
});

// Mutation
const { data } = await apolloClient.mutate({
  mutation,
  variables: { input: { title, description } }
});
```

## Making authorised requests

There are two ways to set the header; one by sending a context object per request.

```javascript
{
  mutation,
  variables: { input: { title, description } },
  context: {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    }
  }
}
```

Another way is by using the `Apollo Link` that lets use customize the flow of data between Apollo Client and our GraphQL server. We can define our client's network behavior as a chain of link objects that execute in a sequence.

```javascript
import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink, gql, concat } from '@apollo/client';
import { getAccessToken } from '../auth';

const httpLink = createHttpLink({ uri: 'http://localhost:9000/graphql' });
const customLink = new ApolloLink((operation, forward) => {
  console.log("[customLink] operation:", operation);
  return forward(operation);
});
```

Apollo Links are a way to customize and control how GraphQL requests flow throught the network. They are like middleware that can inspect, modify, react to GraphQL operations before they are sent or after responses are received. This makes it easy to:
- Add auth headers
- Log requests/responses
- Retry failed requests
- Queue or batch operations
- Split traffic b/w multiple endpoints

**createHttpLink**
This creates the final piece of the link which actually sends the GraphQL request over HTTP to the server. This link:
- Knows the target server URI
- Converts the GraphQL operation into a proper HTTP POST request
- Sends it to the server
- Returns the response

**concat**
Joins two Apollo Links into a chain, this operation flows through each link in the order they are concatenated:
- customLink: Runs first and will add headers
- httpLink: Will send the request