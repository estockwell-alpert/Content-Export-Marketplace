/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSDK } from "@sitecore-marketplace-sdk/client";

/* eslint-disable @typescript-eslint/no-unused-vars */
export const getGuids = (value: string): string[] => {
  if (value.indexOf('|') > -1) {
    const parts = value.split('|');
    return parts;
  } else {
    return [value];
  }
};

export const validateMultiGuids = (value: string) => {
  const guids = getGuids(value);

  for (let i = 0; i < guids.length; i++) {
    if (!validateGuid(guids[i])) {
      return false;
    }
  }

  return true;
};

export const validateGuid = (value: string) => {
  const regex = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}\}?$/i;

  const values = value.split(',');
  for (let i = 0; i < values.length; i++) {
    const val = values[i].trim();

    if (!val || val === '') continue;

    if (!val.match(regex)) {
      console.log(val + ' is not a valid guid');
      return false;
    }
  }

  return true;
};

export const CleanFieldValue = (value: string): string => {
  try {
    if (!value || value == null) return '';
    let cleanFieldValue = value.replace(/[\n\r\t]/gm, '').replace(/"/g, '""');
    // double quote to escape commas
    if (cleanFieldValue.indexOf(',') > -1) {
      cleanFieldValue = '"' + cleanFieldValue + '"';
    }
    return cleanFieldValue;
  } catch (ex) {
    return '';
  }
};

export const convertStringToGuid = (id: string) => {
  return '{' + id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') + '}';
};

export const stripGuid = (id: string) => {
  return id.toLowerCase().replaceAll('-', '').replaceAll('{', '').replaceAll('}', '').trim();
};

export const makeGraphQLQuery = async (appContext: any, client: ClientSDK | null, query: string): Promise<any> => {
  const sitecoreContextId = appContext.resourceAccess?.[0].context.preview;

  if (!sitecoreContextId) {
    const error = "Context ID not found. Make sure your app is configured to use XM Cloud APIs.";
    console.error(
      error
    );
    return error
  }

  const graphQLQuery = {
    query: query,
  };

  // Make the GraphQL query:
  const response = await client?.mutate("xmc.authoring.graphql", {
    params: {
      query: {
        sitecoreContextId,
      },
      body: graphQLQuery
    },
  });

  console.log(response);
  return response;
}

export const hasWindow = (): boolean => typeof window !== undefined;