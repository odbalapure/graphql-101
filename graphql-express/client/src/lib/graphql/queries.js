import { GraphQLClient, gql } from "graphql-request";
import { getAccessToken } from "../auth";

const client = new GraphQLClient("http://localhost:9000/graphql", {
    headers: () => {
        const accessToken = getAccessToken();
        if (accessToken) {
            return { Authorization: `Bearer ${accessToken}` };
        }
        return {};
    }
});

export const getJobs = async () => {
    const query = gql`
        query GetAllJobs {
            jobs {
                id
                title
                description
                date
                company {
                    id
                    name
                }
            }
        }
    `;

    const { jobs } = await client.request(query);
    return jobs;
};


export const getJob = async (id) => {
    const query = gql`
        query JobById($id: ID!) {
            job(id: $id) {
                id
                date
                title
                company {
                    id
                    name
                    description
                }
                description
            }
        }
    `;
    const { job } = await client.request(query, { id });
    return job;
};


export const getCompany = async (id) => {
    const query = gql`
        query GetCompanyById($id: ID!) {
            company(id: $id) {
                id
                name
                description
                jobs {
                id
                date
                title
                description
                }
            }
        }
    `;
    const { company } = await client.request(query, { id });
    return company;
};

export const createJob = async ({ title, description }) => {
    const mutation = gql`
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
    `;
    const { createJob } = await client.request(mutation, {
        input: { title, description }
    });
    return createJob;
};
