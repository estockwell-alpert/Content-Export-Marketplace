
import { IContentNode } from "@/models/IContentNode";
import { ISettings } from "@/models/ISettings";
import { GenerateContentExport, GetTemplateSchema } from "@/services/contentExportUtil";
import { convertStringToGuid, validateGuid } from "@/utils/helpers";
import { Card, CardHeader, Button, Textarea, Alert, AlertDescription, Checkbox, Heading, CardBody, Stack, Wrap } from "@chakra-ui/react";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { Root, createRoot } from "react-dom/client";
import { ContentBrowseModal } from "./ContentBrowseModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { ApplicationContext, ClientSDK } from "@sitecore-marketplace-sdk/client";

interface ImportTool {
    appContext: ApplicationContext | null,
    client: ClientSDK | null
}

export const ImportTool: FC<ImportTool> = ({ appContext, client }) => {
    return (
        <>
            <h1>Import Tool</h1>
        </>
    )
}