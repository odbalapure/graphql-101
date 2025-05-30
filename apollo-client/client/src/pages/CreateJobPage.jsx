import { useState } from 'react';
import { useNavigate } from 'react-router';
// import { createJobMutation, jobByIdQuery } from '../lib/graphql/queries';
// import { useMutation } from '@apollo/client';
import { useCreateJob } from '../lib/graphql/hooks';

function CreateJobPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Built in mutation hook from Apollo Client
  // const [mutate, { loading, error }] = useMutation(createJobMutation);

  const { createJob, loading, error } = useCreateJob(title, description);

  // const handleSubmit = async (event) => {
  //   event.preventDefault();
  //   // const job = await createJob({ title, description });
  //   // Sending a mutation request to our graphql server
  //   const { data: { job } } = await mutate({
  //     // Payload to create a job
  //     variables: { input: { title, description } },
  //     update: (cache, result) => {
  //       // Write to apollo client cache
  //       cache.writeQuery(({
  //         query: jobByIdQuery,
  //         variables: { id: result.data.job.id },
  //         data: result.data
  //       }))
  //     }
  //   });

  //   console.log('job created:', job);
  //   navigate(`/jobs/${job.id}`);
  // };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const job = await createJob();
    navigate(`/jobs/${job.id}`);
  }

  if (error) {
    return (
      <div>
        <div className="has-text-danger">
          Error creating job, please try again later!
        </div>
        <a onClick={() => navigate('/')}>Home Page</a>
      </div >
    )
  }

  return (
    <div>
      <h1 className="title">
        New Job
      </h1>
      <div className="box">
        <form>
          <div className="field">
            <label className="label">
              Title
            </label>
            <div className="control">
              <input className="input" type="text" value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label className="label">
              Description
            </label>
            <div className="control">
              <textarea className="textarea" rows={10} value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <div className="control">
              <button className="button is-link" onClick={handleSubmit} disabled={loading}>
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateJobPage;
