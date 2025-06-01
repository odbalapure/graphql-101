## Server Side Codegen

To setup codegen we need to add the following dependencies. Follow this [doc](https://www.apollographql.com/docs/apollo-server/workflow/generate-types#installing-and-configuring-dependencies) for more details.

We need the following dependencies

```yarn
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers
```

Now run npx `graphql-codegen init` and select the following options:

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

NOTE: Make sure the change the path `./schema.graphql`, to make the codegen work.

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