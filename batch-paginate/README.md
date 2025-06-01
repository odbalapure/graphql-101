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

Basically we wish to create a new DataLoader instance per request instaed of using the same (global) DataLoader instance to serve all the requests. 