import { getJob, getJobs, getJobsByCompany } from "./db/jobs.js";
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
};

function notFoundError(message) {
    return new GraphQLError(message, {
        extensions: {
            code: 'NOT_FOUND',
        }
    });
}
