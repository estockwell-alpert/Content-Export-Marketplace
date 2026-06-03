/* eslint-disable @typescript-eslint/no-explicit-any */
import { ITemplateSchema, IWorksheetSchema, IField } from '@/models/Templates';
import { UpdateQueryTemplate, CreateQueryTemplate, CreateLanguageVersionQueryTemplate } from '@/templates/importQueryTemplates';
import { makeGraphQLQuery } from '@/utils/helpers';
import { ApplicationContext, ClientSDK } from "@sitecore-marketplace-sdk/client";
import * as XLSX from 'xlsx';

export const PostMutationQuery = async (
    appContext: ApplicationContext | null,
    client: ClientSDK | null,
    update: boolean,
    file: File,
    csvData?: any[],
): Promise<string[]> => {
    // show loading modal
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
        loadingModal.classList.remove("hidden");
    }

    if (!csvData && file?.name.endsWith('.xlsx')) {
        console.log('Excel file');
        const fileData = await file.arrayBuffer();
        const workbook = XLSX.read(fileData);
        console.log(workbook);
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheet = workbook.Sheets[workbook.SheetNames[i]];
            const worksheetData = XLSX.utils.sheet_to_json(sheet);

            console.log(worksheetData);
            if (!csvData) {
                csvData = worksheetData;
            } else {
                csvData = csvData.concat(worksheetData);
            }
        }
    }


    if (!csvData) {
        if (loadingModal) {
            loadingModal.classList.add("hidden");
        }
        return ['No file data found'];
    }

    const queries = [];

    // iterate through requests
    for (let i = 0; i < csvData.length; i++) {
        let query = '';

        if (update) {
            query = UpdateQueryTemplate;
        } else {
            query = CreateQueryTemplate;
        }

        const row = csvData[i];
        // basic data
        query = query.replace('pathFragment', row['Item Path']);
        query = query.replace('ItemName', row['Name']);
        query = query.replace('ItemTemplate', row['Template']);

        if (!update && (!row['Item Path'] || !row['Name'] || !row['Template'])) {
            if (loadingModal) {
                loadingModal.classList.add("hidden");
            }
            return ['Missing required columns. Please make sure your CSV includes columns for Item Path, Template, and Name'];
        }

        if (row['Language']) {
            const languageFragment = `language: "` + row['Language'] + `"`;
            query = query.replace('languageFragment', languageFragment);
        } else {
            query = query.replace('languageFragment', '');
        }

        const fieldFragments = await generateFieldsFragment(row, appContext, client);

        query = query.replace('fieldsFragment', fieldFragments);

        console.log(query);
        queries.push(query);
    }

    const errors: string[] = [];
    let successfullQueries = 0;

    try {
        for (let i = 0; i < queries.length; i++) {
            const results = await makeGraphQLQuery(appContext, client, queries[i]);
            console.log('Results: ');
            console.log(results);

            if (results.error) {
                errors.push("Something went wrong: " + results.error.detail);
                break;
            }

            // test this
            if (results.data.errors) {
                for (let j = 0; j < results.data.errors.length; j++) {
                    const error = results.data.errors[j];
                    const csvItemPath = csvData[i]['Item Path'];

                    // if error is version does not exist and our import file includes Language, then try CreateLanguageVersionQueryTemplate
                    if (error?.message?.indexOf("does not contain version") > -1 && csvData[i]['Language'] && csvData[i]['ID']) {

                        const languageFragment = `language: "` + csvData[i]['Language'] + `"`;
                        const createVersionQuery = CreateLanguageVersionQueryTemplate
                            .replace('pathFragment', csvData[i]['ID'])
                            .replace('languageFragment', languageFragment)

                        // first create version
                        const versionResult = await makeGraphQLQuery(appContext, client, createVersionQuery);
                        console.log(versionResult);
                        if (versionResult?.data?.errors) {
                            for (let l = 0; l < versionResult.data.errors.length; l++) {
                                const secondaryError = versionResult.data.errors[j];
                                errors.push("Error on Line " + (i + 2) + ": " + csvItemPath + " - " + secondaryError.message.replace(/[\r\n]+/gm, ' '));
                            }
                        } else {
                            // on success, re-run update query
                            const updateResult = await makeGraphQLQuery(appContext, client, queries[i]);
                            if (updateResult?.data?.errors) {
                                for (let l = 0; l < updateResult.data.errors.length; l++) {
                                    const updateError = updateResult.data.errors[j];
                                    errors.push("Error on Line " + (i + 2) + ": " + csvItemPath + " - " + updateError.message.replace(/[\r\n]+/gm, ' '));
                                }
                            } else {
                                successfullQueries++;
                            }
                        }

                    } else {
                        errors.push("Error on Line " + (i + 2) + ": " + csvItemPath + " - " + error.message.replace(/[\r\n]+/gm, ' '));
                    }
                }
            } else {
                successfullQueries++;
            }
        }
    } catch (error) {
        console.log(error);

        if (loadingModal) {
            loadingModal.classList.add("hidden");
        }
        errors.push(JSON.stringify(error));
        return [JSON.stringify(error)];
    }

    if (loadingModal) {
        loadingModal.classList.add("hidden");
    }

    console.log('ERRORS: ');
    console.log(errors);
    let messages: string[] = [];

    if (successfullQueries > 0) {
        messages.push('Successfully ' + (update ? 'updated' : 'created') + ' ' + successfullQueries + ' item(s)');
    }

    if (errors.length > 0) {
        if (!(errors.length == 1 && errors[0].indexOf("Something went wrong") > -1)) {
            messages.push(errors.length + ' error(s) occured:');
        }
        messages = messages.concat(errors);
    }
    return messages;
};

export const generateFieldsFragment = async (row: any, appContext: ApplicationContext | null, client: ClientSDK | null) => {
    let fieldFragments = '';
    for (const property in row) {
        // skip core columns
        let field = property.trim().toLowerCase();
        let fieldType = '';
        if (
            field === 'item path' ||
            field === 'template' ||
            field === 'id' ||
            field === 'name' ||
            field === 'language' ||
            field === ""
        ) {
            continue;
        }

        let value = row[property];
        // skip fields that don't exist
        if (value.toLowerCase() === "n/a") {
            continue;
        }

        // transform field if it includes type definition with pipe delimiter, e.g. "My Link Field|Link"
        if (field.indexOf("|") > -1) {
            const parts = field.split("|");
            field = parts[0].trim();
            fieldType = parts[1].trim().toLowerCase();

            value = await transformFieldValue(value, fieldType, appContext, client);
        }

        const cleanValue = value.replaceAll("\"", "\\\"");

        const fieldFragment =
            `
          { name: "` +
            field +
            `", value: "` +
            cleanValue +
            `" }`;

        fieldFragments += fieldFragment;
    }
    return fieldFragments;
}

export const transformFieldValue = async (value: string, fieldType: string, appContext: ApplicationContext | null, client: ClientSDK | null) => {
    switch (fieldType.toLowerCase()) {
        case 'link': {
            // external links
            if (value.toLowerCase().startsWith("http://") || (value.startsWith("/") && !value.toLowerCase().startsWith("/sitecore"))) {
                return `<link anchor="" linktype="external" class="" title="" target="_blank" querystring="" url="${value}" />`;
            }
            if (value.toLowerCase().startsWith("mailto:")) {
                return `<link anchor="" linktype="mailto" class="" title="" target="_blank" querystring="" url="${value}" />`;
            }

            // try process sitecore path to get item ID for internal links
            if (value.toLowerCase().startsWith("/sitecore")) {
                value = await getExistingItemId(appContext, client, value);
            }

            const possibleGuidValue = GetStringAsGuidString(value);

            return `<link anchor="" linktype="internal" class="" title="" target="_blank" querystring="" id="${possibleGuidValue}" />`;
        }
        case 'image': {
            // if value is already in Sitecore media format, return as is
            if (value.toLowerCase().startsWith("/sitecore/media library")) {
                const imageId = await getExistingItemId(appContext, client, value);
                return `<image mediaid="${imageId}" alt="" />`;
            }

            return value;
        }
        case 'droplink':
        case 'droptree': {
            const itemId = await getExistingItemId(appContext, client, value);
            return itemId;
        }
        case 'droplist': {
            return value;
        }
        case 'treelist':
        case 'multilist': {
            const values = await Promise.all(value.split("|").map((x) => getExistingItemId(appContext, client, x.trim())));
            return values.join("|");
        }
        case 'checkbox': {
            return (value.toLowerCase() === "true" || value === "1") ? "1" : "0";
        }
        case 'date':
        case 'datetime': {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                const pad = (n: number) => String(n).padStart(2, '0');
                return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
            }
            return value;
        }
        default:
            return value;
    }
}

export const GetStringAsGuidString = (value: string) => {
    // Strip surrounding {}, [], or whitespace, then hyphens, and check for 32 hex chars
    const stripped = value.trim().replace(/^[{[\s]+|[}\]\s]+$/g, '').replace(/-/g, '');
    if (/^[0-9a-fA-F]{32}$/.test(stripped)) {
        return `{${stripped.slice(0, 8)}-${stripped.slice(8, 12)}-${stripped.slice(12, 16)}-${stripped.slice(16, 20)}-${stripped.slice(20)}}`.toUpperCase();
    }
    return value;
}

export async function getExistingItemId(appContext: ApplicationContext | null, client: ClientSDK | null, path: string): Promise<string> {
    if (!path.startsWith("/sitecore")) return path;

    const getExistingItemQuery = `{
                        item(
                            where: {
                                database: "master",
                                path: "${path}"
                            }
                        ){
                            itemId,
                            name,
                            path
                        }
                    }`

    const response = await makeGraphQLQuery(appContext, client, getExistingItemQuery);

    return response?.data?.data?.item?.itemId || path;
}

export const ResultsToXslx = (templates: ITemplateSchema[], fileName?: string, headers?: string[]) => {
    // Create Excel workbook and worksheet
    const workbook = XLSX.utils.book_new();
    //const worksheet = XLSX.utils?.json_to_sheet(templates);
    //XLSX.utils.book_append_sheet(workbook, worksheet, 'Templates Schema');

    const worksheets: IWorksheetSchema[] = [];

    for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const folder = templates[i].folder;

        if (template.sections.length == 0) continue;

        const worksheetIndex = worksheets.findIndex((x) => x.sheetName === folder);
        let worksheet: IWorksheetSchema;
        if (worksheetIndex === -1) {
            worksheet = {
                sheetName: folder,
                data: [],
            };
        } else {
            worksheet = worksheets[worksheetIndex];
        }

        const templateRow: IField = {
            template: template.templateName + (template.renderingParams ? ' (Rendering Parameters)' : ''),
            path: template.templatePath,
            baseTemplates: template.baseTemplates,
            section: '',
            name: '',
            machineName: '',
            fieldType: '',
            required: undefined,
            source: '',
            defaultValue: '',
            helpText: '',
            inheritedFrom: '',
        };

        worksheet.data.push(templateRow);

        for (let j = 0; j < template.sections.length; j++) {
            worksheet.data.push({
                template: '',
                path: '',
                baseTemplates: '',
                section: template.sections[j].name,
                name: '',
                machineName: '',
                fieldType: '',
                required: undefined,
                source: '',
                defaultValue: '',
                helpText: '',
                inheritedFrom: '',
            });

            const fields = template.sections[j].fields;
            const dataLines = fields?.sort(fieldsSort);
            const dataLinesClean = dataLines.map((x: IField) => {
                delete x.sortOrder;
                return x;
            });
            worksheet.data = worksheet.data.concat(dataLinesClean);
        }

        // add empty line for spacing
        worksheet.data.push([]);

        console.log(worksheet.data);

        // udpate worksheets list
        if (worksheetIndex === -1) {
            worksheets.push(worksheet);
        } else {
            worksheets[worksheetIndex] = worksheet;
        }
    }

    const header = headers
        ? [headers]
        : [
            [
                'Template',
                'Path',
                'Base Templates',
                'Section',
                'Field Name',
                'Machine Name',
                'Field Type',
                'Required',
                'Source',
                'Default Value',
                'Help Text',
                'Inherited From',
            ],
        ];

    if (worksheets.length === 0) {
        return ['No results found'];
    }

    // add every worksheet to file
    for (let i = 0; i < worksheets.length; i++) {
        const worksheet = XLSX.utils?.json_to_sheet(worksheets[i].data);
        XLSX.utils.sheet_add_aoa(worksheet, header);
        XLSX.utils.book_append_sheet(workbook, worksheet, worksheets[i].sheetName);
    }

    // Save the workbook as an Excel file
    XLSX.writeFile(workbook, `${fileName ?? 'Templates Schema'}.xlsx`);
    console.log(`Exported data to xslx`);
};

export function fieldsSort(a: IField, b: IField) {
    const sortOrderA = a.sortOrder ?? 0;
    const sortOrderB = b.sortOrder ?? 0;
    if (sortOrderA < sortOrderB) {
        return -1;
    }
    if (sortOrderA > sortOrderB) {
        return 1;
    }
    return 0;
}

export interface Item {
    itemId: string;
    name: string;
    path: string;
}

export interface QueryItemData {
    item: Item;
}

export interface QueryItemResponse {
    data: {
        data: QueryItemData;
    };
}