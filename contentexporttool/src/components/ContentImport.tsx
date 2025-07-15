/* eslint-disable @typescript-eslint/no-explicit-any */
import { ITemplateSchema } from "@/models/Templates";
import { PostMutationQuery, ResultsToXslx } from "@/services/contentImportUtil";
import { Card, CardHeader, Input, Button, Alert, AlertDescription, Stack, Heading, Icon } from "@chakra-ui/react";
import { ApplicationContext, ClientSDK } from "@sitecore-marketplace-sdk/client";
import Papa from 'papaparse';
import { FC, useState } from "react";
import { Separator } from "./ui/separator";
import { CardContent } from "./ui/card";
import { mdiBookOpenPageVariantOutline } from "@mdi/js";


interface ImportTool {
    appContext: ApplicationContext | null,
    client: ClientSDK | null
}

export const ImportTool: FC<ImportTool> = ({ appContext, client }) => {
    const [selectedFile, setSelectedFile] = useState<File>();
    const [isUpdate, setIsUpdate] = useState<boolean>(true);
    const [isCreate, setIsCreate] = useState<boolean>(false);
    const [parsedCsvData, setParsedCsvData] = useState<any>();
    const [errors, setErrors] = useState<string[]>([]);
    const [fileKey, setFileKey] = useState<string>('');

    const clearFileInput = () => {
        //const inpt = document.getElementById("inptFile");
        //inpt.value
        setFileKey(Math.random().toString(36));
        setSelectedFile(undefined);
    };

    const onFileChange = (event: any) => {
        setErrors([]);
        setParsedCsvData(null);
        // Update the state
        const file = event.target.files[0];
        setSelectedFile(file);

        try {
            if (!file) {
                alert('No file selected');
                return;
            }

            if (file.type === 'text/csv') {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        setParsedCsvData(results.data);
                    },
                });
            }
        } catch (error) {
            console.error('Error parsing file:', error);
        }
    };

    const downloadExample = async () => {
        const templates: ITemplateSchema[] = [];

        templates.push({
            templateName: 'Promo',
            templatePath: '{7479293E-4A3A-47C8-9370-2D32EF37E07C}',
            baseTemplates: '{1930BBEB-7805-471A-A3BE-4858AC7CF696}',
            folder: 'Templates',
            sections: [
                {
                    name: 'Content',
                    fields: [
                        {
                            template: '',
                            path: '',
                            section: '',
                            name: 'Image',
                            machineName: 'image',
                            fieldType: 'Image',
                            source: '',
                        },
                        {
                            template: '',
                            path: '',
                            section: '',
                            name: 'Heading',
                            machineName: 'heading',
                            fieldType: 'Single-Line Text',
                            source: '',
                            defaultValue: '$name',
                        },
                        {
                            template: '',
                            path: '',
                            section: '',
                            name: 'Link 1',
                            machineName: 'link1',
                            fieldType: 'General Link',
                            source: '',
                        },
                    ],
                },
                {
                    name: 'Search',
                    fields: [
                        {
                            template: '',
                            path: '',
                            section: '',
                            name: 'Content Type',
                            machineName: 'contentType',
                            fieldType: 'Droplist',
                            source: 'query:$site/Search/Enumerations/Content Type/*',
                        },
                        {
                            template: '',
                            path: '',
                            section: '',
                            name: 'Taxonomies',
                            machineName: 'taxonomies',
                            fieldType: 'Multiroot Treelist',
                            source: '{5344462B-31B3-443B-8FD5-8A7A881A66A3}',
                            helpText: 'not displayed, only used for search',
                        },
                    ],
                },
            ],
        });

        const headers = [
            'Template',
            'Parent',
            'Base Templates',
            'Section',
            'Field Name',
            'Machine Name',
            'Field Type',
            'Required',
            'Source',
            'Default Value',
            'Help Text',
            ' ',
        ];

        ResultsToXslx(templates, 'Example Schema Import', headers);
    };

    const handleRunImport = async () => {
        try {
            if (!selectedFile) {
                alert('Please upload a file');
                return;
            }

            if (isUpdate) {
                const messages = await PostMutationQuery(appContext, client, true, parsedCsvData);
                console.log(messages);
                setErrors(errors);
            } else if (isCreate) {
                const messages = await PostMutationQuery(appContext, client, false, parsedCsvData);
                console.log(messages);
                setErrors(messages);
            }

            const message = isUpdate ? 'Update' : 'Create';
            if (errors && errors.length > 0) {
                alert(message + ' completed with errors; check error messages');
            } else {
                alert(message + 'd ' + parsedCsvData.length + ' items');
            }

            // clear out csv data
            setParsedCsvData(null);
        } catch (error) {
            console.error('Error importing content:', error);
        }
    };

    return (
        <>
            <Card className="rounded-sm border bg-card">
                <CardHeader>
                    <Stack spacing={2}>
                        <Heading>Import Content</Heading>
                        <p>
                            Import content from CSV files into your Sitecore instance <br />
                        </p>
                        <a target="_blank" href="https://github.com/estockwell-alpert/Content-Export-Marketplace/blob/main/README.md#using-the-application"><Icon><path d={mdiBookOpenPageVariantOutline}></path></Icon> Documentation</a>

                    </Stack>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className={errors.length > 1 ? 'errors' : ''}>
                        {errors.map((message, index) => (
                            <span key={index}>{message}</span>
                        ))}
                    </p>

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <div className="flex justify-between gap-4">
                            <Input
                                key={fileKey}
                                id="inptFile"
                                type="file"
                                accept=".csv,.xlsx"
                                onChange={onFileChange}
                                className="cursor-pointer"
                            />
                            <Button onClick={clearFileInput} variant="ghost">Clear</Button>
                        </div>

                        <Button onClick={handleRunImport} disabled={!selectedFile}>
                            Import
                        </Button>
                    </div>

                    {selectedFile && (
                        <div className="rounded-md bg-muted p-4">
                            <h3 className="font-medium mb-2">File Details</h3>
                            <div className="space-y-1 text-sm">
                                <p>File Name: {selectedFile.name}</p>
                                <p>Type: {selectedFile.type}</p>
                                <p>Modified: {new Date(selectedFile.lastModified).toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    <div className="importOptions">
                        <div className="radio">
                            <label>
                                <input
                                    type="radio"
                                    value="update"
                                    checked={isUpdate}
                                    onChange={() => {
                                        setIsUpdate(true);
                                        setIsCreate(false);
                                    }}
                                />
                                Update
                            </label>
                        </div>
                        <div className="radio">
                            <label>
                                <input
                                    type="radio"
                                    value="create"
                                    checked={isCreate}
                                    onChange={() => {
                                        setIsCreate(true);
                                        setIsUpdate(false);
                                    }}
                                />
                                Create
                            </label>
                        </div>
                    </div>

                    <Alert>
                        <AlertDescription>
                            <Stack spacing="4">
                                <h3 className="font-medium">Getting Started</h3>
                                <p>Required CSV columns for updating items:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>
                                        <strong>Item Path</strong> - Item path string e.g. /sitecore/content/Home
                                    </li>
                                </ul>
                                <p>Required CSV columns for new items:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>
                                        <strong>Item Path</strong> - Parent item ID (GUID)
                                    </li>
                                    <li>
                                        <strong>Template</strong> - Item template (GUID)
                                    </li>
                                    <li>
                                        <strong>Name</strong> - Item name (string)
                                    </li>
                                </ul>

                                <Separator />

                                <div className="space-y-2">
                                    <h3 className="font-medium">Important Notes</h3>
                                    <ul className="list-disc pl-4 space-y-1 text-sm">
                                        <li>Review all modified items before publishing</li>
                                        <li>Only CSV format is supported</li>
                                        <li>Item Path must be string for Update, GUID for Create</li>
                                        <li>
                                            Supports all field types, formatted as <b>raw values</b>
                                        </li>
                                        <li>Add Language column for specific versions</li>
                                    </ul>
                                    <h3 className="font-medium">Tips</h3>
                                    <p>
                                        The best way to make sure your file is formatted correctly is to export your content first, edit
                                        in Excel, and then import the same file; it will already be formatted correctly.
                                    </p>
                                </div>
                            </Stack>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </>
    )
}