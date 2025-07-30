/* eslint-disable @typescript-eslint/no-explicit-any */
import { PostMutationQuery } from "@/services/contentImportUtil";
import { Card, CardHeader, Input, Button, Alert, AlertDescription, Stack, Heading, AlertIcon } from "@chakra-ui/react";
import { ApplicationContext, ClientSDK } from "@sitecore-marketplace-sdk/client";
import Papa from 'papaparse';
import { FC, useState } from "react";
import { Separator } from "./ui/separator";
import { CardContent } from "./ui/card";
import { AuthorInfo } from "./AuthorInfo";


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
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>();
    const [fileKey, setFileKey] = useState<string>('');

    const clearFileInput = () => {
        //const inpt = document.getElementById("inptFile");
        //inpt.value
        setFileKey(Math.random().toString(36));
        setSelectedFile(undefined);
    };

    const onFileChange = (event: any) => {
        setSuccess(false);
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

    const handleRunImport = async () => {
        setSuccess(false);
        setErrors([]);
        try {
            if (!selectedFile) {
                alert('Please upload a file');
                return;
            }

            let messages: string[] = [];

            if (isUpdate) {
                messages = await PostMutationQuery(appContext, client, true, selectedFile, parsedCsvData);
            } else if (isCreate) {
                messages = await PostMutationQuery(appContext, client, false, selectedFile, parsedCsvData);
            }

            console.log(messages);

            if (messages.length > 0 && messages[0].startsWith("Success")) {
                setSuccess(true);
                setSuccessMessage(messages[0]);

                if (messages.length > 1) {
                    setErrors(messages.slice(1))
                }
            } else {
                setErrors(messages);
            }

            // clear out csv data
            setParsedCsvData(null);
            clearFileInput();
        } catch (error) {
            console.error('Error importing content:', error);
            clearFileInput();
        }
    };

    return (
        <>
            <style>{`.downloadBtn { display: none }`}</style>
            <Stack spacing="4" >
                <Card className="rounded-sm border bg-card">
                    <CardHeader>
                        <Stack spacing={2}>
                            <Heading>Import Content</Heading>
                            <p>
                                Import content from CSV files into your Sitecore instance <br />
                            </p>

                        </Stack>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                                <Button onClick={clearFileInput} variant="outline">Clear</Button>
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

                        {success &&
                            <Alert status="success">
                                <AlertIcon />
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        }
                        {errors && errors.length > 0 &&
                            <Alert status="error">
                                <AlertIcon />
                                <AlertDescription>
                                    <ul>
                                        {errors?.map((item, index) => (
                                            <li key={index}>
                                                {item}
                                            </li>

                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        }

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
                        <br />
                    </CardContent>
                </Card>
                <AuthorInfo />
            </Stack>
        </>
    )
}