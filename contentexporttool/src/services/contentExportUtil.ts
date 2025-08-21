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
  inheritors?: boolean,
  fields?: string,
  languages?: string,
  includeTemplate?: boolean,
  includeLang?: boolean,
  convertGuids?: boolean,
  allFields?: boolean
): Promise<any> => {
  // show loading modal
  const loadingModal = document.getElementById('loading-modal');

  includeLang = true; // since Auth export exports all languages by default, just always show the column. Check if Edge does all langs by default too

  // hide download button
  const wrapper = document.getElementById("downloadBtnWrapper");
  if (wrapper) {
    wrapper.classList.add("hidden");
  }

  if (loadingModal) {
    loadingModal.classList.remove("hidden");
  }

  // do everythign here
  //let hasNext = true;
  let results: any[] = [];
  const cursor = '';
  //let calls = 0;

  // get inheritor templates
  if (inheritors && templates && templates !== "") {
    const allTemplates = await GetInheritorTemplates(appContext, client, templates);
    templates = allTemplates.join(", ");
    includeTemplate = true;
  }

  // generate query
  const querystring = GetSearchQuery(startItem, templates, fields, languages, cursor, allFields);

  // make GQL request
  const response = await makeGraphQLQuery(appContext, client, querystring);

  if (response.error) {
    return response;
  }

  results = response.data.data.search.results;

  console.log(results);

  // generate CSV with results
  const csvData: string[] = [];

  // first row of CSV

  const fieldNames = fields?.split(',') ?? [];
  let headerRow = 'Item Path,Name,ID,';
  if (includeTemplate) {
    headerRow += 'Template,';
  }
  if (includeLang) {
    headerRow += 'Language,';
  }

  // get all fields first
  if (allFields) {
    for (let i = 0; i < results.length; i++) {
      const result = results[i]?.innerItem;
      if (!result) continue;

      const resultFields = result?.fields?.nodes;
      if (resultFields && resultFields.length > 0) {
        for (let z = 0; z < resultFields.length; z++) {
          const resultField = resultFields[z];

          const field = resultField.name;

          if (fieldNames.indexOf(field) === -1) {
            fieldNames.push(field);
          }
        }
      }
    }
  }

  // add all field names to the header row
  if (fieldNames) {
    for (let i = 0; i < fieldNames.length; i++) {
      if (fieldNames[i].trim() === '') {
        continue;
      }

      headerRow += fieldNames[i].trim() + ',';
    }
  }
  // insert headerRow at start of csv
  csvData.push(headerRow);

  for (let i = 0; i < results.length; i++) {
    let result = results[i];

    result = result.innerItem;

    if (!result) continue;
    if (typeof result === 'string' && result.indexOf('GqlApiError:Error') > -1) {
      alert('Something went wrong. Check the console for errors');
      if (loadingModal) {
        loadingModal.classList.add("hidden");
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

    if (allFields) {
      const resultFields = result?.fields?.nodes;
      // iterate through all fields
      for (let f = 0; f < fieldNames.length; f++) {
        const fieldName = fieldNames[f];
        let rawValue = "";
        if (resultFields?.some((obj: any) => obj?.name === fieldName)) {
          const field = resultFields.filter(function (obj: any) { return obj.name === fieldName; })[0];
          rawValue = field?.value;
        } else {
          rawValue = "n/a";
        }

        const fieldValue = await ProcessFieldValue(rawValue, convertGuids ?? false, result, allFields ?? false, appContext, client);
        resultRow += (fieldValue ?? 'n/a') + ',';
      }
    } else if (fieldNames) {
      for (let j = 0; j < fieldNames.length; j++) {
        const field = fieldNames[j].trim().replaceAll(' ', '').replaceAll('__', '');

        if (fieldNames[j].trim() === '') {
          continue;
        }

        const rawValue = result[field]?.value ?? 'n/a';
        const fieldValue = await ProcessFieldValue(rawValue, convertGuids ?? false, result, allFields ?? false, appContext, client);

        resultRow += (fieldValue ?? 'n/a') + ',';
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
  // get button
  let element = document.getElementById("downloadBtn") as HTMLAnchorElement;

  // just a backup...
  if (element === null) {
    element = document.createElement('a');
    element.innerHTML = "DOWNLOAD"
    element.classList.add('downloadBtn');
    element.id = "downloadBtn";
    document.body.appendChild(element); // Required for this to work in FireFox
  }

  // set href to file blob
  const file = new Blob([csvString], { type: 'text/csv' });
  element.href = URL.createObjectURL(file);

  // set file name dynamically
  const downloadFileName = "ContentExport.csv";
  element.setAttribute("download", downloadFileName);

  // show wrapper
  if (wrapper) {
    // scroll to download button and highlight
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    Flash(0, wrapper);
  }

  element.click();
  // remove button after download
  //element.remove();

  if (loadingModal) {
    loadingModal.classList.add("hidden");
  }

  return { success: true }
};

export const Flash = (i: number, elem: HTMLElement) => {
  elem.classList.remove("hidden");
  setTimeout(function () {

    if (elem.classList.contains("highlight")) {
      elem.classList.remove("highlight");
    } else {
      elem.classList.add("highlight");
    }

    i++;

    console.log('hello ' + i);
    if (i < 6) {
      Flash(i, elem);
    }
  }, 300)
}

export const ProcessFieldValue = async (
  fieldValue: string,
  convertGuids: boolean,
  result: any,
  allFields: boolean,
  appContext: ApplicationContext | null,
  client: ClientSDK | null) => {
  // check if field is guid/guids
  const guidFieldDictionary: { [id: string]: [name: string] } = {};

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
        const linkedItemsQueryString = GetSearchQuery(guid, '', '', result.language?.name ?? '', '', allFields);

        // make GQL request
        const linkedItemResults = await makeGraphQLQuery(appContext, client, linkedItemsQueryString);

        const linkedItemResult = linkedItemResults.data.data.search.results[0].innerItem;

        const itemName = linkedItemResult?.name;
        guidFieldDictionary[fieldValue] = itemName;

        convertedValue += itemName;
      }
    }
    fieldValue = convertedValue;
  }

  // double quote to escape commas
  if (fieldValue.indexOf(',') > -1) {
    const cleanFieldValue = fieldValue.replace(/[\n\r\t]/gm, '').replace(/"/g, '""');
    fieldValue = '"' + cleanFieldValue + '"';
  }

  return fieldValue;
}

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

export const GetInheritorTemplates = async (
  appContext: any,
  client: ClientSDK | null,
  templateString?: string): Promise<string[]> => {

  const selectedTemplates = templateString?.split(',').map(x => x.trim().toLowerCase());
  if (!selectedTemplates || selectedTemplates.length === 0) {
    return [];
  }

  // add our base templates to the return list
  const inheritors: string[] = selectedTemplates;

  // get all templates
  const templatesFolderId = "{3C1715FE-6A13-4FCF-845F-DE308BA9741D}";
  const templateTemplateId = "{AB86861A-6030-46C5-B394-E8F99E8B87DB}"
  const allTemplatesQuery = GetSchemaQuery(templatesFolderId, templateTemplateId);
  const response = await makeGraphQLQuery(appContext, client, allTemplatesQuery);
  const templateResults = response?.data?.data?.search?.results ?? response?.results;

  // filter through templates to get templates that include our base templates
  for (let i = 0; i < templateResults.length; i++) {
    const template = templateResults[i];
    const baseTemplates = template.innerItem.baseTemplate.value.toLowerCase();

    for (let j = 0; j < selectedTemplates?.length; j++) {
      if (baseTemplates.indexOf(selectedTemplates[j]) > -1) {
        inheritors.push(template.innerItem.itemId);
        break;
      }
    }
  }

  // save inheritors for template ID in cache
  console.log(inheritors);
  return inheritors;
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

  const templateKeyFields = localStorage.getItem(templates);
  if (templateKeyFields) {
    const fields = JSON.parse(templateKeyFields) as string[];
    return fields;
  } else {
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

    localStorage.setItem(templates, JSON.stringify(fields.sort()));
    return fields.sort();
  }
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