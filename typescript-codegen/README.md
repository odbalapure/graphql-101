## Server Side Codegen

To setup codegen we need to add the following dependencies. Follow this [doc](https://www.apollographql.com/docs/apollo-server/workflow/generate-types#installing-and-configuring-dependencies) for more details.

We need the following dependencies

```yarn
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers
```

Now run `npx graphql-codegen init` and select the following options:

```zsh
? What type of application are you building? Backend - API or server
? Where is your schema?: (path or url) ./
? Pick plugins: TypeScript (required by other typescript plugins), TypeScript Resolvers 
(strongly typed resolve functions)
? Where to write the output: src/generated/schema.ts
? Do you want to generate an introspection file? No
? How to name the config file? codegen.json
? What script in package.json should run the codegen? codegen
Fetching latest versions of selected plugins...
```

NOTE: Make sure to change the path `./schema.graphql`, to make the codegen work.

```json
{
    "overwrite": true,
    // Use this instead of "./"
    "schema": "./schema.graphql",
}
```

## Avoid __typename

To avoid typename in the `schema.ts`. All such configurations can be found [here](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript).

Update the `codegen.json` and add a `config` object with `skipTypename` value.
```json
{
    "overwrite": true,
    "schema": "./schema.graphql",
    "generates": {
        "src/generated/schema.ts": {
            "plugins": [
                "typescript",
                "typescript-resolvers"
            ],
            "config": {
                "skipTypename": true
            }
        }
    }
}
```

## Resolver Types

Using the auto generated default type for resolver cannot be used directly.

```typescript
import { Resolvers } from './generated/schema.js';

export const resolvers: Resolvers
```

TS does not know what the `id` is and what the `offset` is. If we misspell the params the editor does not show any error as TS has no info about this object.

Another issue is that the object types from the database might not have the exact types as in the schema. 

This can be fixed using the [@graphql-codegen/typescript-resolvers](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-resolvers).

```json
{
    "config": {
    "mappers": {
        "Company": "../db/types.js#CompanyEntity",
        "Job": "../db/types.js#JobEntity"
    },
    "skipTypename": true
    }
}
```

This is done to put the `CompanyEntity/JobEntity` types in the `graphql.ts` file.

NOTE: The `.js` is required to fix the following error
```
Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../db/types.js'
```

Now the IDE intellisense will tell the types on hover.

## Typing the context

```typescript
import DataLoader from 'dataloader';
import { CompanyEntity, UserEntity } from './db/types.js';

export interface ResolverContext {
  companyLoader: DataLoader<string, CompanyEntity, string>;
  user?: UserEntity;
}

// Using the context type
async function getContext({ req }): Promise<ResolverContext> {}
```

We can also move the newly defined type to the graphql.ts

```json
"config": {
    "contextType": "../resolvers#ResolverContext",
}
```

## Client Code Generator

You need add these two for client side code generation

```yarn
npm install @graphql-codegen/cli @graphql-codegen/client-preset
```

For client it generates multiple autogen type files hence we need to specify `src/generated`, instead of a single `graphql.ts`.

codegen config for the client includes

```json
{
    "overwrite": true,
    "schema": "../server/schema.graphql",
    "documents": "src/lib/graphql/queries.ts",
    "generates": {
        "src/generated/": {
            "preset": "client",
            "plugins": [],
            "config": {
                "skipTypename": true
            }
        }
    }
}
```

## Typed Queries

The `src/generated` folder consists of the 
```
.
├── fragment-masking.ts
├── gql.ts
├── graphql.ts
└── index.ts
```

`graphql.ts` contains the code generated from the scehma.graphql file
Whereas, the `gql.ts` contains code generated from the queries and mutation

```typescript
import { graphql } from '../../generated/gql';

export const jobByIdQuery = gql`
  query JobById($id: ID!) {
    job(id: $id) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;
```

NOTE:  
- After hover you'll notice its a `TypedDocumentNode`.
- Also its not mandatory to include fragement definition  as a variable i.e. `jobDetailFragment`.

## Fragment Masking

But using `graphql()` function has a problem, how you look at the components; you will see following errors on the props, eg:

```typescript
const job: {
    ' $fragmentRefs'?: {
        "JobDetailFragment": JobDetailFragment;
    };
}
```

When you use the graphql() function, it parses and registers the GraphQL fragments or operations at compile-time. However, without fragment masking, the generated types tend to be broad and rely on generic structures like $fragmentRefs, rather than giving you narrow, strongly-typed props specific to the component.

More to read about this over [here](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#fragment-masking).

So, to distill the prop types specific to a component, fragment masking is necessary because `graphql()` function alone doesn't enforce field-level granularity.

We can either to fragment masking using `useFragment` or update the codegen.json file:

```json
{
    "generates": {
        "src/generated/": {
            "presetConfig": {
                "fragmentMasking": false
            }
        }
    }
}
```