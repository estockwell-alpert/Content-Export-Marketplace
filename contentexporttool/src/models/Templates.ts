/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IWorksheetSchema {
    sheetName: string;
    data: any[];
  }
  
  export interface ITemplateSchema {
    templateName: string;
    baseTemplates: string;
    templatePath: string;
    renderingParams?: boolean;
    folder: string;
    sections: ITemplateSection[];
  }
  
  export interface ITemplateSection {
    name: string;
    fields: IField[];
  }
  
  export interface IField {
    template: string;
    path: string;
    baseTemplates?: string;
    section: string;
    name: string;
    machineName: string;
    fieldType: string;
    required?: string;
    source: string;
    defaultValue?: string;
    helpText?: string;
    inheritedFrom?: string;
    sortOrder?: number;
  }
  