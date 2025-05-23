import { useEffect, useState } from 'react';
import JobList from '../components/JobList';
import { getJobs } from '../lib/graphql/queries';

function HomePage() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    // No need to use (jobs) => setJobs(jobs)
    // As the response is already the jobs array
    getJobs()
      .then(setJobs);
  }, []);

  return (
    <div>
      <h1 className="title">
        Job Board
      </h1>
      <JobList jobs={jobs} />
    </div>
  );
}

export default HomePage;
