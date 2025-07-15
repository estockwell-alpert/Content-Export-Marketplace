/* eslint-disable @typescript-eslint/no-explicit-any */
import { ITemplateSchema, IWorksheetSchema, IField } from '@/models/Templates';
import { UpdateQueryTemplate, CreateQueryTemplate } from '@/templates/importQueryTemplates';
import { makeGraphQLQuery } from '@/utils/helpers';
import { ApplicationContext, ClientSDK } from "@sitecore-marketplace-sdk/client";

import * as XLSX from 'xlsx';

export const PostMutationQuery = async (
    appContext: ApplicationContext | null,
    client: ClientSDK | null,
    update: boolean,
    csvData?: any[],
    file?: File
): Promise<string[]> => {
    // show loading modal
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
        loadingModal.style.display = 'block';
    }

    if (!csvData && file?.name.endsWith('.xlsx')) {
        console.log('Excel file');
        const fileData = await file.arrayBuffer();
        const workbook = XLSX.read(fileData);
        console.log(workbook);
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheet = workbook.Sheets[workbook.SheetNames[i]];
            const worksheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            console.log(worksheetData);
            if (!csvData) {
                csvData = worksheetData;
            } else {
                csvData = csvData.concat(worksheetData);
            }
        }
    }


    if (!csvData) {
        alert('No file data found');
        return [];
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
            alert('Missing required columns. Please make sure your CSV includes columns for Item Path, Template, and Name');
            if (loadingModal) {
                loadingModal.style.display = 'none';
            }
            return [];
        }

        if (row['Language']) {
            const languageFragment = `language: "` + row['Language'] + `"`;
            query = query.replace('languageFragment', languageFragment);
        } else {
            query = query.replace('languageFragment', '');
        }

        let fieldFragments = '';
        for (const property in row) {
            if (
                property === 'Item Path' ||
                property === 'Template' ||
                property === 'ID' ||
                property === 'Name' ||
                property === 'Language' ||
                property === ''
            ) {
                continue;
            }

            const value = row[property];
            const fieldFragment =
                `
          { name: "` +
                property +
                `", value: "` +
                value.replace('"', '&quot;') +
                `" }`;

            fieldFragments += fieldFragment;
        }

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

            // test this
            if (results.errors) {
                for (let j = 0; j < results.errors.length; j++) {
                    const error = results.errors[j];
                    errors.push(error.message.replace(/[\r\n]+/gm, ' '));
                }
            } else {
                successfullQueries++;
            }
        }
    } catch (error) {
        console.log(error);

        if (loadingModal) {
            loadingModal.style.display = 'none';
        }

        return [JSON.stringify(error)];
    }

    if (loadingModal) {
        loadingModal.style.display = 'none';
    }

    console.log('ERRORS: ');
    console.log(errors);
    let messages: string[] = [];

    if (successfullQueries > 0) {
        messages.push('Successfully created ' + successfullQueries + ' template(s)');
    }

    if (errors.length > 0) {
        messages.push(errors.length + ' error(s) occured:');
        messages = messages.concat(errors);
    }
    return messages;
};


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
        alert('No results found');
        return;
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