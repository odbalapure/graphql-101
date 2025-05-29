import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink, gql, concat } from '@apollo/client';
// import { GraphQLClient } from 'graphql-request';
import { getAccessToken } from '../auth';

const httpLink = createHttpLink({ uri: 'http://localhost:9000/graphql' });
const customLink = new ApolloLink((operation, forward) => {
  console.log("[customLink] operation:", operation);
  const accessToken = getAccessToken();
  if (accessToken) {
    operation.setContext({
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }
  return forward(operation);
});

const apolloClient = new ApolloClient({
  uri: 'http://localhost:9000/graphql',
  // Cache data returned from the server "in memory"
  cache: new InMemoryCache(),
  link: concat(customLink, httpLink),
});

// const client = new GraphQLClient('http://localhost:9000/graphql', {
//   headers: () => {
//     const accessToken = getAccessToken();
//     if (accessToken) {
//       return { 'Authorization': `Bearer ${accessToken}` };
//     }
//     return {};
//   },
// });

export async function createJob({ title, description }) {
  const mutation = gql`
    mutation CreateJob($input: CreateJobInput!) {
      job: createJob(input: $input) {
        id
      }
    }
  `;

  // const { job } = await client.request(mutation, {
  //   input: { title, description },
  // });
  const { data } = await apolloClient.mutate({
    mutation,
    variables: { input: { title, description } },
    context: {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  });
  return data.job;
}

export async function getCompany(id) {
  const query = gql`
    query CompanyById($id: ID!) {
      company(id: $id) {
        id
        name
        description
        jobs {
          id
          date
          title
        }
      }
    }
  `;
  const { data } = await apolloClient.query({ query, variables: { id } });
  return data.company;
}

export async function getJob(id) {
  const query = gql`
    query JobById($id: ID!) {
      job(id: $id) {
        id
        date
        title
        company {
          id
          name
        }
        description
      }
    }
  `;
  // const { job } = await client.request(query, { id });
  const { data } = await apolloClient.query({ query, variables: { id } });
  return data.job;
}

export async function getJobs() {
  const query = gql`
    query GetJobs {
      jobs {
        id
        date
        title
        company {
          id
          name
        }
      }
    }
  `;
  // const { jobs } = await client.request(query);
  const { data } = await apolloClient.query({ query });
  return data.jobs;
}
