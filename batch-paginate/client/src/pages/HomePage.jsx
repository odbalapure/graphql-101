import { useState } from 'react';
import JobList from '../components/JobList';
import { useJobs } from '../lib/graphql/hooks';
import PaginationBar from '../components/PaginationBar';

const JOBS_PER_PAGE = 20;

function HomePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { jobs, loading, error } =
    useJobs(JOBS_PER_PAGE, (currentPage - 1) * JOBS_PER_PAGE);

  console.log('[HomePage]', { jobs, loading, error });
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div className="has-text-danger">Data unavailable</div>;
  }
  const totalPages = Math.ceil(jobs.totalCount / JOBS_PER_PAGE);
  return (
    <div>
      <h1 className="title">
        Job Board
      </h1>
      <div>
        {/* <button disabled={currentPage == 1} type="button" onClick={() => setCurrentPage(currentPage - 1)}>
          Previous
        </button>
        &nbsp;
        <span>[{currentPage} of {totalPages}]</span>
        &nbsp;
        <button disabled={totalPages === currentPage} type="button" onClick={() => setCurrentPage(currentPage + 1)}>
          Next
        </button> */}

        <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
      <JobList jobs={jobs.items} />
    </div>
  );
}

export default HomePage;
