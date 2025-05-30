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

const jobDetailsFragment = gql`
  fragment JobDetails on Job {
    id
    title
    date
    description
    company {
      id
      name
      description
    }
  }
`;

export const jobByIdQuery = gql`
  ${jobDetailsFragment}
  query GetJob($id: ID!) {
    job(id: $id) {
      ...JobDetails
    }
  }
`;

export async function createJob({ title, description }) {
  const mutation = gql`
    mutation CreateJob($input: CreateJobInput!) {
      job: createJob(input: $input) {
        id
        title
        date
        description
        company {
          id
          name
          description
        }
      }
    }
  `;

  // const { job } = await client.request(mutation, {
  //   input: { title, description },
  // });
  const { data } = await apolloClient.mutate({
    mutation,
    variables: { input: { title, description } },
    update: (cache, result) => {
      cache.writeQuery(({
        query: jobByIdQuery,
        variables: { id: result.data.job.id },
        data: result.data
      }))
    }
  });
  return data.job;
}

export async function getCompany(id) {
  const query = gql`
    ${jobDetailsFragment}
    query CompanyById($id: ID!) {
      company(id: $id) {
        ...JobDetails
      }
    }
  `;
  const { data } = await apolloClient.query({ query, variables: { id } });
  return data.company;
}

export async function getJob(id) {
  // const { job } = await client.request(query, { id });
  const { data } = await apolloClient.query({
    query: jobByIdQuery,
    variables: { id }
  });
  return data.job;
}

export async function getJobs() {
  const query = gql`
    ${jobDetailsFragment}
    query GetJobs {
      jobs {
        ...JobDetails
      }
    }
  `;
  // const { jobs } = await client.request(query);
  const { data } = await apolloClient.query({
    query,
    fetchPolicy: 'network-only',
  });
  return data.jobs;
}
