import { createJob, getJob, getJobs, getJobsByCompany, deleteJob, updateJob } from "./db/jobs.js";
import { getCompany } from "./db/companies.js";
import { GraphQLError } from "graphql";

export const resolvers = {
    Query: {
        jobs: () => getJobs(),
        // job: (_root, args) => getJob(args.id)
        job: async (_root, { id }) => {
            const job = await getJob(id);
            if (!job) {
                throw notFoundError(`Job with id ${id} not found`);
            }
            return job;
        },
        company: async (_root, { id }) => {
            const company = await getCompany(id);
            if (!company) {
                throw notFoundError(`Company with id ${id} not found`);
            }
            return company;
        }
    },
    Job: {
        // The first argument to a "field resolver" is the parent object
        date: (job) => job.createdAt.slice(0, 'yyyy-mm-dd'.length),
        company: (job) => getCompany(job.companyId)
    },
    Company: {
        jobs: (company) => getJobsByCompany(company.id)
    },
    Mutation: {
        createJob: (_root, { input: { title, description } }, context) => {
            if (!context.auth) {
                throw unauthorisedError('Missing authentication');
            }

            const companyId = 'FjcJCHJALA4i'; // TODO: get companyId from access token
            return createJob({ companyId, title, description });
        },
        deleteJob: (_root, { id }) => deleteJob(id),
        updateJob: (_root, { input: { id, title, description } }) => updateJob({ id, title, description }),
    }
};

function notFoundError(message) {
    return new GraphQLError(message, {
        extensions: {
            code: 'NOT_FOUND',
        }
    });
}

function unauthorisedError(message) {
    return new GraphQLError(message, {
        extensions: {
            code: 'UNAUTHORISED',
            message: 'You must be logged in to create a job.'
        }
    })
}
