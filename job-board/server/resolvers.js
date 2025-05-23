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
        date: (job) => job.createdAt.slice(0, 'yyyy-mm-dd'.length),
        company: (job) => getCompany(job.companyId)
    },
    Company: {
        jobs: (company) => getJobsByCompany(company.id)
    },
};
