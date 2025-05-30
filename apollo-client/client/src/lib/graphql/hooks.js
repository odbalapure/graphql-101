import { useMutation, useQuery } from "@apollo/client";
import { companyByIdQuery, createJobMutation, jobByIdQuery, jobsQuery } from "./queries";

export const useCompany = (id) => {
    const { data, loading, error } = useQuery(companyByIdQuery, {
        variables: { id }
    });

    return { company: data?.company, loading, error: Boolean(error) };
};

export const useJob = (id) => {
    const { data, loading, error } = useQuery(jobByIdQuery, {
        variables: { id }
    });

    return { job: data?.job, loading, error: Boolean(error) };
};

export const useJobs = () => {
    const { data, loading, error } = useQuery(jobsQuery);

    return { jobs: data?.jobs, loading, error: Boolean(error) };
}

export const useCreateJob = (title, description) => {
    const [mutate, { loading, error }] = useMutation(createJobMutation);

    const createJob = async () => {
        const { data: { job } } = await mutate({
            variables: { input: { title, description } },
            update: (cache, result) => {
                cache.writeQuery(({
                    query: jobByIdQuery,
                    variables: { id: result.data.job.id },
                    data: result.data
                }))
            }
        });

        return job;
    }

    return {
        createJob,
        loading,
        error: Boolean(error)
    }
};
