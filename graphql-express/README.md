## GraphQL with Express

@apollo/server provides a middelware to use GraphQL with an express server.

```javascript
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

// Use express middleware to handle GraphQL requests
app.use('/graphql', expressMiddleware(apolloServer));

// Start express server
app.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Creating Schema

```graphql
type Query {
    """ Get all jobs posted to the board """
    jobs: [Job!]
    job(id: ID!): Job
    company(id: ID!): Company
}

""" Represent a company that posted the job """
type Company {
    id: ID!
    name: String!
    description: String
    jobs: [Job!]!
}

""" Represents a job posted to the board """
type Job {
    id: ID!
    """ The __date__ the job was posted in ISO-8601 format. Eg: `2025-05-23` """
    date: String!
    title: String!
    company: Company!
    description: String
}
```

NOTE: Triple quote comments i.e. description comments help describe the schema at the code level as well as in the GraphQL client interface / sandbox / playround.

## Creating resolvers

```javascript
import { getJob, getJobs, getJobsByCompany } from "./db/jobs.js";
import { getCompany } from "./db/companies.js";

export const resolvers = {
    Query: {
        jobs: () => getJobs(),
        // job: (_root, args) => getJob(args.id)
        job: (_root, { id }) => getJob(id),
        company: (_root, { id }) => getCompany(id)
    },
    Job: {
        // The first argument to a "field resolver" is the parent object
        // This will return a readable date whenever a job object is queried
        date: (job) => job.createdAt.slice(0, 'yyyy-mm-dd'.length),
        // This lets us query the company details of the job
        company: (job) => getCompany(job.companyId)
    },
    Company: {
        jobs: (company) => getJobsByCompany(company.id)
    },
};
```

Resolvers can be written as a separate module to keep the resolver mappings clean.

```javascript
export const resolvers = {
  Query: {
    jobs: jobResolver
  }
}

export const jobResolver = (_root, args) => {
  const { id } = args;
};
```

## Error Handling

The type definition must be handled carefully. Eg: making a field non-nullable can lead to an INTERNAL_SERVER_ERROR if the expected data is not found—even if there are no bugs in the code.

```graphql
type Query {
  job(id: ID!): Job!
}
```

In such cases the error needs to handled explicitly.

```javascript
import { GraphQLError } from "graphql";

export const resolvers = {
    Query: {
        job: async (_root, { id }) => {
            const job = await getJob(id);
            if (!job) {
                throw new GraphQLError(`Job with id ${id} found`, {
                  extensions: {
                      code: 'NOT_FOUND',
                  }
              });
            }
            return job;
        },
    }
}
```

NOTE: A message property can also be used in the `extensions` object.

## Input Types

Creating a common "input" type instead of mentioning every single input variable.

```graphql
type Mutation {
  createJob(input: CreateJobInput!): Job
}

input CreateJobInput {
    title: String!
    description: String
}
```

Now the GraphQL mutation request will look like this

```graphql
mutation CreatJob($input: CreateJobInput!) {
  createJob(input: $input) {
    id
    date
    title
    company {
      id
      name
      description
    }
  }
}
```

## Passing context

```javascript
const getContext = () => {
  return { foo: "bar" }
}

app.use('/graphql', expressMiddleware(apolloServer, { context: getContext }));
```

Now the context object can be accessed in a resolver function

```javascript
createJob: (_root, { input: { title, description } }, context)
```

NOTE: The context function can also access the `req` object, since we are using **apollo express middleware**.

If we consider an example of the `express-jwt` middleware that requires us to set the req.auth property. Otherwise an authorisation request should error out if its absent.

```javascript
// Setting the "auth" property
const getContext = ({ req }) => {
  return { auth: req.auth };
}

app.use('/graphql',
  expressMiddleware(apolloServer, { context: getContext }));

// Validatin the "auth" property in the resolver function
if (!context.auth) {
    throw new GraphQLError('Missing authentication', {
        extensions: {
            code: 'UNAUTHENTICATED',
            message: 'You must be logged in to create a job.'
        }
    })
}
```

NOTE: The context function can return a promise too.

## Sending access token via client

The token can be set in the `GraphQLClient` object as

```javascript
const client = new GraphQLClient("http://localhost:9000/graphql", {
    headers: () => {
        const accessToken = getAccessToken();
        if (accessToken) {
            return { Authorization: `Bearer ${accessToken}` };
        }
        return {};
    }
});
```

## Where to autenticate

We should authenticate users with a separate login handler instead of doing it at the GraphQL level. Otherwise, we would have create a login resolver (getting username/password) and pass an access token to every resolver that requires authentication.

We could authenticate users in the GraphQL context but the authentication logic should be decoupled.

Authentication works on an underlying protocol in this case HTTP. GraphQL operates on top of HTTP. GraphQL is a query language. Due to this distincition auth should ideally happen before GraphQL resolver get involved.
