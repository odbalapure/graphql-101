## Batch Processing

The following snippet will log all the queries that are triggered by a GraphQL operation.

For eg: If we list all the jobs, each job object always has a reference to a company. So basically we are not only querying jobs but company data as well.

```javascript
import knex from 'knex';

export const connection = knex({
  client: 'better-sqlite3',
  connection: {
    filename: './data/db.sqlite3',
  },
  useNullAsDefault: true,
});

connection.on('query', ({ sql, bindings }) => {
  const query = connection.raw(sql, bindings).toQuery();
  console.log('[connection] query', query)
});
```

```sql
[connection] query select * from `job`
[connection] query select * from `company` where `id` = 'FjcJCHJALA4i' limit 1
[connection] query select * from `company` where `id` = 'FjcJCHJALA4i' limit 1
[connection] query select * from `company` where `id` = 'Gu7QW9LcnF5d' limit 1
```

There are 3 job postings — two from company ID 'FjcJCHJALA4i' and one from 'Gu7QW9LcnF5d'. This results in 4 database queries: 1 for the jobs and 3 to fetch companies (with a duplicate query for 'FjcJCHJALA4i').

This is a typical N + 1 query problem, where each job triggers an additional query to fetch its associated company, even when some are repeated. The company data could be fetched more efficiently using a single query for all unique company IDs.

## Data Loaders

A batch loading function accepts an Array of keys, and returns a Promise which resolves to an Array of values.

Then loads individual values from the loader. [DataLoader](https://www.npmjs.com/package/dataloader) will coalesce all individual loads which occur within a single frame of execution (a single tick of the event loop) and then call your batch function with all the requested keys.

```javascript
// Creating DataLoader instance
import DataLoader from 'dataloader';

export const companyLoader = new DataLoader(async (ids) => {
  console.log('[companyLoader] ids:', ids);
  const companies = await getCompanyTable().select().whereIn('id', ids);
  return ids.map((id) => companies.find((company) => company.id === id));
});

// Using it in a resolver
Job: {
  company: (job) => companyLoader.load(job.companyId),
},
```

Now there will be two database queries, where the company queries are batched together.

```
[connection] query select * from `job`
[connection] query select * from `company` where `id` in ('FjcJCHJALA4i', 'Gu7QW9LcnF5d')
```

## Per-Request Cache

DataLoader provides a memoization cache for all loads which occur in a single request to your application. After `.load()` is called once with a given key, the resulting value is cached to eliminate redundant loads.

DataLoader caching does not replace Redis/MemCache, or any other shared application-level cache. DataLoader is first and foremost a data loading mechanism, and its cache only servers the purpose of not repeatedly loading thesame data in the context of a single request to your Application. Inshort `load()` is a memoization function.

Basically we wish to create a new DataLoader instance per request instead of using the same (global) DataLoader instance to serve all the requests.

```javascript
export const createCompanyLoader = () => {
  return new DataLoader(async (ids) => {
    const companies = await getCompanyTable().select().whereIn('id', ids);
    return ids.map((id) => companies.find((company) => company.id === id));
  })
};
```

Now we can call this function on every request
```javascript
// Passing the loader through the "context"
async function getContext({ req }) {
  const companyLoader = createCompanyLoader();
  const context = { companyLoader }
  if (req.auth) {
    context.user = await getUser(req.auth.sub);
  }
  return context;
}

// Now consume the data loader function via "context"
Job: {
  company: (job, _args, { companyLoader }) => companyLoader.load(job.companyId),
  date: (job) => toIsoDate(job.createdAt),
},
```

## Pagination

It tells where the page begins, eg: for displaying 7 items in total; with 3 items per page; the 1st page starts at `offset=0`, 2nd one starts at `offset=3`, 3rd one starts at `offset=6`. This works well in most of the scenarios.

But the drawback here is that **offset pagination** assumes the item listing never changes. What if someone posts a new job and the latest job needs to be on the top of the 1st page.

NOTE: Cursor based pagination can fix this issue but its slightly more complex to implement.

## Ordering data

First query the data in descending order based on `createdAt` date.

```javascript
getJobTable().select().orderBy('createdAt', 'desc');
```

## Limit and offset

```javascript
export async function getJobs(limit, offset = 0) {
  const query = getJobTable().select().orderBy('createdAt', 'desc');
  if (limit) {
    query.limit(limit);
  }
  if (offset) {
    query.offset(offset);
  }
  // NOTE: The query will be executed when we resolve the promise using "await"
  return await query;
}
```

## Client side changes

Now pass the offset and limit to the GraphQL queries

```javascript
const { data, loading, error } = useQuery(jobsQuery, {
    variables: { limit, offset },
    fetchPolicy: 'network-only',
  });

export const jobsQuery = gql`
  query Jobs($limit: Int, $offset: Int) {
    jobs(limit: $limit, offset: $offset) {
    }
  }`;
```

But we need to know the total no. of items to know where the pagination is supposed to stop.

```graphql
type Query {
  company(id: ID!): Company
  job(id: ID!): Job
  jobs(limit: Int, offset: Int): JobSubList!
}

type JobSubList {
  items: [Job!]!
  totalCount: Int!
}
```

For this you need to return the total job count

```javascript
export const countJobs = async () => {
  // In Knex "first()" is shorthand for "limit(1)"
  // It returns the first row of the result set
  const { count } = await getJobTable().first().count('* as count');
  return count;
}
```

## Updating the component logic

Create a state variable currentPage to keep track of the `offset`.

```javascript
function HomePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { jobs, loading, error } =
    useJobs(JOBS_PER_PAGE, (currentPage - 1) * JOBS_PER_PAGE);

  const totalPages = Math.ceil(jobs.totalCount / JOBS_PER_PAGE);
  return (
    <div>
      <h1 className="title">
        Job Board
      </h1>
      <div>
        <button disabled={currentPage == 1} type="button" onClick={() => setCurrentPage(currentPage - 1)}>
          Previous
        </button>
        &nbsp;
        <span>[{currentPage} of {totalPages}]</span>
        &nbsp;
        <button disabled={totalPages === currentPage} type="button" onClick={() => setCurrentPage(currentPage + 1)}>
          Next
        </button>
      </div>
      <JobList jobs={jobs.items} />
    </div>
  );
}
```