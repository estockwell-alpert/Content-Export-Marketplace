import { ClientSDK } from "@sitecore-marketplace-sdk/client";

// GraphQL query to retrieve item details:
// XXXXX This is what you'll change with your dynamically generated query
const graphQLQuery = {
  query: `query { sites { name } }`,
};

export default function GraphQLQuery({
  appContext,
  client,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appContext: any;
  client: ClientSDK | null;
}) {
  const makeGraphQLQuery = async () => {
    // Get the Sitecore Context ID from the application context:
    const sitecoreContextId = appContext.resources?.[0]?.context.preview;

    // Check if the Sitecore Context ID is available:
    if (!sitecoreContextId) {
      console.error(
        "Sitecore Context ID not found in application context. Make sure your app is configured to use XM Cloud APIs."
      );
      return;
    }

    // Make the GraphQL query:
    const response = await client?.mutate("xmc.authoring.graphql", {
      params: {
        query: {
          sitecoreContextId,
        },
        body: graphQLQuery,
      },
    });

    console.log(response);
  };

  return <button onClick={makeGraphQLQuery}>Make GraphQL query</button>;
}
