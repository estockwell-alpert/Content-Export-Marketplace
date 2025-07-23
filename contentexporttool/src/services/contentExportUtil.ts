/* eslint-disable @typescript-eslint/no-explicit-any */
import { ItemChildrenQuery } from "@/templates/searchQueryTemplate";
import { GetSchemaQuery, GetSearchQuery } from "@/utils/createGqlQuery";
import { getGuids, makeGraphQLQuery, validateMultiGuids } from "@/utils/helpers";
import { ApplicationContext, ClientSDK } from "@sitecore-marketplace-sdk/client";

export const GenerateContentExport = async (
  appContext: ApplicationContext | null,
  client: ClientSDK | null,
  startItem?: string,
  templates?: string,
  fields?: string,
  languages?: string,
  includeTemplate?: boolean,
  includeLang?: boolean,
  convertGuids?: boolean
) => {
  // show loading modal
  const loadingModal = document.getElementById('loading-modal');

  includeLang = true; // since Auth export exports all languages by default, just always show the column. Check if Edge does all langs by default too

  // remove previous button
  const btns = document.getElementsByClassName("downloadBtn");
  if (btns && btns.length > 0) {
    for (let i = 0; i < btns.length; i++) {
      btns[i].remove();
    }
  }

  if (loadingModal) {
    loadingModal.style.display = 'block';
  }

  // do everythign here
  //let hasNext = true;
  let results: any[] = [];
  const cursor = '';
  //let calls = 0;

  // generate query
  const querystring = GetSearchQuery(startItem, templates, fields, languages, cursor);

  // make GQL request
  const response = await makeGraphQLQuery(appContext, client, querystring);
  results = response.data.data.search.results;

  console.log(results);

  // generate CSV with results
  const csvData = [];

  // first row of CSV
  const fieldStrings = fields?.split(',');
  let headerRow = 'Item Path,Name,ID,';
  if (includeTemplate) {
    headerRow += 'Template,';
  }
  if (includeLang) {
    headerRow += 'Language,';
  }
  if (fieldStrings) {
    for (let i = 0; i < fieldStrings.length; i++) {
      if (fieldStrings[i].trim() === '') {
        continue;
      }

      headerRow += fieldStrings[i].trim() + ',';
    }
  }
  csvData.push(headerRow);

  const guidFieldDictionary: { [id: string]: [name: string] } = {};

  for (let i = 0; i < results.length; i++) {
    let result = results[i];

    result = result.innerItem;

    if (!result) continue;
    if (typeof result === 'string' && result.indexOf('GqlApiError:Error') > -1) {
      alert('Something went wrong. Check the console for errors');
      if (loadingModal) {
        loadingModal.style.display = 'none';
      }
      return;
    }

    let resultRow = '';

    resultRow = result.path + ',' + result.name + ',' + result.itemId + ',';

    if (includeTemplate) {
      resultRow += result.template?.name + ',';
    }
    if (includeLang) {
      resultRow += result.language?.name + ',';
    }

    if (fieldStrings) {
      for (let j = 0; j < fieldStrings.length; j++) {
        const field = fieldStrings[j].trim().replaceAll(' ', '').replaceAll('__', '');

        if (fieldStrings[j].trim() === '') {
          continue;
        }

        let fieldValue = result[field]?.value ?? 'n/a';

        // check if field is guid/guids
        if (convertGuids && fieldValue !== '' && validateMultiGuids(fieldValue)) {
          console.log('Value is a guid; get the item name');

          let convertedValue = '';
          const guids = getGuids(fieldValue);
          for (let g = 0; g < guids.length; g++) {
            const guid = guids[g];
            if (g > 0) {
              convertedValue += '; ';
            }
            if (guidFieldDictionary[guid]) {
              convertedValue += guidFieldDictionary[guid];
            } else {
              // generate query
              const linkedItemsQueryString = GetSearchQuery(guid, '', '', result.language?.name ?? '', cursor);

              // make GQL request
              const linkedItemResults = await makeGraphQLQuery(appContext, client, linkedItemsQueryString);

              let linkedItemResult = linkedItemResults;
              linkedItemResult = linkedItemResults[0]?.innerItem;

              const itemName = linkedItemResult?.name;
              guidFieldDictionary[fieldValue] = itemName;

              convertedValue += itemName;
            }
          }
          fieldValue = convertedValue;
        }

        let cleanFieldValue = fieldValue.replace(/[\n\r\t]/gm, '').replace(/"/g, '""');
        // double quote to escape commas
        if (cleanFieldValue.indexOf(',') > -1) {
          cleanFieldValue = '"' + cleanFieldValue + '"';
        }
        resultRow += (cleanFieldValue ?? 'n/a') + ',';
      }
    }

    csvData.push(resultRow);
  }

  let csvString = '';
  for (let i = 0; i < csvData.length; i++) {
    csvString += csvData[i] + '\n';
  }

  console.log(csvString);

  // DOWNLOAD WON'T WORK UNTIL SITECORE UPDATES SANDBOX PERMISSION
  // add new button
  const element = document.createElement('a');
  element.classList.add('downloadBtn');
  const file = new Blob([csvString], { type: 'text/csv' });
  element.href = URL.createObjectURL(file);
  element.innerHTML = "DOWNLOAD"
  element.download = 'ContentExport.csv';
  element.setAttribute("download", "Content Export.csv");
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
  // remove button after download
  //element.remove();

  if (loadingModal) {
    loadingModal.style.display = 'none';
  }
};

export const GetLanguages = async (
  appContext: ApplicationContext | null,
  client: ClientSDK | null): Promise<string[]> => {

  // generate query
  const languagesNodeId = "{64C4F646-A3FA-4205-B98E-4DE2C609B60F}";
  const languageTemplateId = "{F68F13A6-3395-426A-B9A1-FA2DC60D94EB}";
  const querystring = GetSearchQuery(languagesNodeId, languageTemplateId);

  // make GQL request
  const response = await makeGraphQLQuery(appContext, client, querystring);
  const results = response.data.data.search.results;

  console.log(results);

  return results
    ?.map((result: any) => result.innerItem?.name);

};

export const GetItemChildren = async (
  appContext: any,
  client: ClientSDK | null,
  itemId: string): Promise<any> => {

  const contentQuery = ItemChildrenQuery.replace('[ITEMID]', itemId);
  // make GQL request
  const results = await makeGraphQLQuery(appContext, client, contentQuery);

  console.log(results);

  return results;
};

export const GetAvailableFields = async (
  appContext: any,
  client: ClientSDK | null,
  templates?: string): Promise<string[]> => {


  if (!templates || templates === '') {
    console.log(
      'Enter a start item. If you really want every template in Sitecore, you can enter the ID of the Templates folder. This will take a long time.'
    );
    return [];
  }

  const fieldTemplateId = '{455A3E98-A627-4B40-8035-E683A0331AC7}';

  const templateIds = templates?.split(',');
  const baseTemplates: string[] = [];
  const fields: string[] = [];

  // get all base templates
  for (let i = 0; i < templateIds.length; i++) {
    const baseTemplateIds = await GetBaseTemplateIds(appContext, client, templateIds[i], 0);

    for (let j = 0; j < baseTemplateIds.length; j++) {
      if (!baseTemplates.includes(baseTemplateIds[j])) {
        baseTemplates.push(baseTemplateIds[j]);
      }
    }
  }

  console.log('BEGIN FIELD QUERIES');

  if (baseTemplates.length === 0) return [];
  console.log('Getting fields for ' + baseTemplates.join(", "));
  const allFieldsQuery = GetSearchQuery(baseTemplates.join(","), fieldTemplateId);

  const fieldsResponse = await makeGraphQLQuery(appContext, client, allFieldsQuery);

  console.log(fieldsResponse);
  const fieldsJson = fieldsResponse?.data?.data?.search?.results;
  //console.log(JSON.stringify(fieldsJson));

  for (let f = 0; f < fieldsJson.length; f++) {
    const field = fieldsJson[f].innerItem;

    console.log('');
    console.log('Field ' + f + ': ' + field.name);

    if (!fields.includes(field.name)) {
      fields.push(field.name);
    }
  }


  return fields.sort();
}

export const GetBaseTemplateIds = async (
  appContext: any,
  client: ClientSDK | null,
  startItem: string,
  depth: number,
  existingTemplateIds?: string[]
): Promise<string[]> => {
  const templateTemplateId = '{AB86861A-6030-46C5-B394-E8F99E8B87DB}';
  let results: string[] = [];

  if (depth > 5) {
    return results;
  }

  if (!startItem || startItem === '') {
    return [];
  }

  console.log('Getting base templates for ' + startItem);

  console.log('Depth: ' + depth.toString());

  // get all templates...
  const allTemplatesQuery = GetSchemaQuery(startItem, templateTemplateId);

  const response = await makeGraphQLQuery(appContext, client, allTemplatesQuery);
  const templateResults = response?.data?.data?.search?.results ?? response?.results;

  if (!templateResults?.length || templateResults.length < 1) { return [] }

  console.log(templateResults?.length + ' results for ' + startItem);

  for (let i = 0; i < templateResults.length; i++) {
    const template = templateResults[i]?.innerItem;
    if (!template) continue;

    console.log('Current template is ' + template.name + ' - ' + template.itemId);
    // abort if we're in the system templates
    if (
      template.path.startsWith('/sitecore/templates/System/') ||
      template.name === 'Standard template' ||
      template.name === 'Standard Rendering Parameters' ||
      template.name === 'IDynamicPlaceholder'
    ) {
      console.log('Skipping ' + template.name + ' ' + template.path);
      continue;
    }

    results.push(template.itemId);

    console.log('Added ' + template.name + ' to list');

    const baseTemplates = template.baseTemplate?.value
      ?.toLowerCase()
      .replaceAll('-', '')
      .replaceAll('{', '')
      .replaceAll('}', '')
      .split('|')
      .filter((x: string) => x && x !== '');

    if (baseTemplates.length > 0) {
      console.log(
        baseTemplates.length + ' base templates found on ' + template.name + ': ' + template.baseTemplate.value
      );

      for (let b = 0; b < baseTemplates.length; b++) {
        if (existingTemplateIds && existingTemplateIds.indexOf(baseTemplates[b])) {
          continue;
        }

        console.log('Get base templates for ' + baseTemplates[b] + '...');

        const baseresults = await GetBaseTemplateIds(appContext, client, baseTemplates[b], depth++, results);

        console.log('Base Results: ' + JSON.stringify(baseresults));

        results = results.concat(baseresults);
      }
    } else {
      console.log('No base templates on ' + template.name);
    }
  }

  console.log('Finished for ' + startItem);
  console.log('Results: ' + JSON.stringify(results));
  return results;
};