/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { SaveSettingsModal } from "./SaveSettingsModal";

interface ExportToolProps {
  appContext: ApplicationContext | null,
  client: ClientSDK | null
}

export const ExportTool: FC<ExportToolProps> = ({ appContext, client }) => {
  const [startItem, setStartItem] = useState<string>('');
  const [templatesStartItem, setTemplatesStartItem] = useState<string>();
  const [templates, setTemplates] = useState<string>('');
  const [fields, setFields] = useState<string>();
  const [languages, setLanguages] = useState<string>();
  const [createdDate, setCreatedDate] = useState<boolean>();
  const [createdBy, setCreatedBy] = useState<boolean>();
  const [updatedDate, setUpdatedDate] = useState<boolean>();
  const [updatedBy, setUpdatedBy] = useState<boolean>();
  const [convertGuids, setConvertGuids] = useState<boolean>();
  const [includeTemplate, setIncludeTemplate] = useState<boolean>();
  const [includeLang, setIncludeLang] = useState<boolean>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedSettings, setSavedSettings] = useState<ISettings[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>();
  const [errorStartItem, setErrorStartItem] = useState<boolean>(false);
  const [errorTemplates, setErrorTemplates] = useState<boolean>(false);
  const [browseContentOpen, setBrowseContentOpen] = useState<boolean>(false);
  const [browseTemplatesOpen, setBrowseTemplatesOpen] = useState<boolean>(false);
  const [contentMainRoot, setContentMainRoot] = useState<Root>();
  const [currentSelections, setCurrentSelections] = useState<any[]>([]);
  const [currentTemplateSelections, setCurrentTemplateSelections] = useState<any[]>([]);

  const sitecoreRootId = '{11111111-1111-1111-1111-111111111111}-root';

  const clearStartItem = () => {
    setStartItem('');
    setCurrentSelections([]);
  };

  const handleStartItem = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!validateGuid(event.target.value ?? '')) {
      setErrorStartItem(true);
    } else {
      setErrorStartItem(false);
    }
    const inputValue = event.target.value;
    setStartItem(inputValue);
  };
  const handleTemplates = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!validateGuid(event.target.value ?? '')) {
      setErrorTemplates(true);
    } else {
      setErrorTemplates(false);
    }
    setTemplates(event.target.value);
  };
  const handleFields = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFields(event.target.value);
  };
  const handleLanguages = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLanguages(event.target.value);
  };

  const clearAll = () => {
    setSavedSettings([]);
    setStartItem('');
    setTemplates('');
    setTemplatesStartItem('');
    setFields('');
    setLanguages('');
    setCreatedBy(false);
    setCreatedDate(false);
    setUpdatedBy(false);
    setConvertGuids(false);
    setUpdatedDate(false);
    setIncludeLang(false);
    setAvailableFields([]);
    setErrorStartItem(false);
    setErrorTemplates(false);
    setIncludeTemplate(false);
    setAvailableFields([]);
  };

  const runExport = async () => {
    let itemFields = fields;
    if (createdBy) {
      itemFields += ',__Created By';
    }
    if (updatedBy) {
      itemFields += ',__Updated By';
    }
    if (updatedDate) {
      itemFields += ',__Updated';
    }
    if (createdDate) {
      itemFields += ',__Created';
    }

    console.log(itemFields);

    await GenerateContentExport(
      appContext,
      client,
      startItem,
      templates,
      itemFields,
      languages,
      includeTemplate,
      includeLang,
      convertGuids
    );
  };

  const fieldIsSelected = (field: string): boolean => {
    const currentFields = fields?.split(',').map((x) => x.trim());

    return currentFields?.includes(field) ?? false;
  };

  const addField = (field: string) => {
    if (fieldIsSelected(field)) return;

    if (fields) {
      setFields(fields + ', ' + field);
    } else {
      setFields(field);
    }
  };

  const resetTree = () => {
    if (contentMainRoot) {
      contentMainRoot.render(<ul id={sitecoreRootId}></ul>);
    }
  };

  const selectNode = (e: any) => {
    const id = convertStringToGuid(e.target.parentElement.getAttribute('data-id'));
    const name = e.target.parentElement.getAttribute('data-name');

    if (e.target.classList.contains('selected')) {
      // remove id
      const updatedSelections = currentSelections?.filter((item: IContentNode) => item.itemId !== id);
      setCurrentSelections(updatedSelections);
    } else {
      // add ID
      const selectedItem = { itemId: id, name: name, children: [] };
      const selectedItems: any[] =
        currentSelections === undefined ? [selectedItem] : currentSelections?.concat(selectedItem);
      setCurrentSelections(selectedItems);
    }
  };

  const selectTemplateNode = (e: any) => {
    const id = convertStringToGuid(e.target.parentElement.getAttribute('data-id'));
    const name = e.target.parentElement.getAttribute('data-name');

    if (e.target.classList.contains('selected')) {
      // remove id
      const updatedSelections = currentTemplateSelections?.filter((item: IContentNode) => item.itemId !== id);
      setCurrentTemplateSelections(updatedSelections);
    } else {
      // add ID
      const selectedItem = { itemId: id, name: name, children: [] };
      const selectedItems: any[] =
        currentTemplateSelections === undefined ? [selectedItem] : currentTemplateSelections?.concat(selectedItem);
      setCurrentTemplateSelections(selectedItems);
    }
  };

  const browseFields = async () => {
    setAvailableFields([]);
    const fieldsList: string[] = [];

    if (!templates) {
      alert('Enter at least one template ID in the Templates field');
      return;
    }

    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
      loadingModal.style.display = 'block';
    }

    const results = await GetTemplateSchema(appContext, client, templates);

    console.log(results);

    if (!results) return;

    for (let i = 0; i < results.length; i++) {
      const template = results[i];
      for (let s = 0; s < template.sections.length; s++) {
        const section = template.sections[s];
        for (let f = 0; f < section.fields.length; f++) {
          const field = section.fields[f];
          const fieldName = field.machineName;
          if (fieldsList.indexOf(fieldName) === -1) {
            fieldsList.push(fieldName);
          }
        }
      }
    }

    setAvailableFields(fieldsList);

    if (loadingModal) {
      loadingModal.style.display = 'none';
    }

  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved) as ISettings[];
        setSavedSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  useEffect(() => {
    const rootElem = document.getElementById(sitecoreRootId);
    if (!rootElem) return;
    setContentMainRoot(createRoot(rootElem));
    resetTree();
  }, [resetTree]);

  const handleSaveSettings = (newSettings: Omit<ISettings, 'id'>) => {
    const settings: ISettings = {
      ...newSettings,
      id: crypto.randomUUID(),
      startItem: startItem ?? '',
      templates: templates ?? '',
      fields: fields ?? '',
      languages: languages ?? '',
      schemaStartItem: templatesStartItem ?? '',
      includeLang: includeLang,
      includeTemplate: includeTemplate,
      createdBy: createdBy,
      createdDate: createdDate,
      updatedBy: updatedBy,
      updatedDate: updatedDate,
    };

    // check if setting with name already exists
    const filteredSettings = savedSettings.filter((settings) => settings.name !== newSettings.name);

    // add
    const updatedSavedSettings = [...filteredSettings, settings];

    setSavedSettings(updatedSavedSettings);
    localStorage.setItem('settings', JSON.stringify(updatedSavedSettings));

    setIsModalOpen(false);
  };

  const handleSelectSettings = (value: string) => {
    const setting = savedSettings.find((setting) => setting.name === value);

    if (!setting) {
      alert("Something went wrong, couldn't find settings");
      return;
    }

    setStartItem(setting.startItem ?? '');
    setTemplates(setting.templates ?? '');
    setFields(setting.fields);
    setLanguages(setting.languages);
    setIncludeLang(setting.includeLang);
    setIncludeTemplate(setting.includeTemplate);
    setCreatedBy(setting.createdBy);
    setCreatedDate(setting.createdDate);
    setUpdatedBy(setting.updatedBy);
    setUpdatedDate(setting.updatedDate);
    setConvertGuids(setting.convertGuids);
  };

  return (
    <>
      {/* Content Browse */}
      <ContentBrowseModal
        appContext={appContext}
        client={client}
        browseContentOpen={browseContentOpen}
        setBrowseContentOpen={setBrowseContentOpen}
        selectNode={selectNode}
        currentSelections={currentSelections ?? []}
        startItem={startItem ?? ''}
        setStartItem={setStartItem}
        setCurrentSelections={setCurrentSelections}
        startNode={{ itemId: '{11111111-1111-1111-1111-111111111111}', name: 'sitecore' }}
      ></ContentBrowseModal>

      {/* Template Browse */}
      <ContentBrowseModal
        appContext={appContext}
        client={client}
        browseContentOpen={browseTemplatesOpen}
        setBrowseContentOpen={setBrowseTemplatesOpen}
        selectNode={selectTemplateNode}
        currentSelections={currentTemplateSelections ?? []}
        startItem={templatesStartItem ?? ''}
        setStartItem={setTemplates}
        setCurrentSelections={setCurrentTemplateSelections}
        startNode={{ itemId: '{3C1715FE-6A13-4FCF-845F-DE308BA9741D}', name: 'templates' }}
        templatesOnly={true}
      ></ContentBrowseModal>


      <Card>
        <div className="space-y-4">
          <div className="container">
            <div className="row">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Saved Settings</h2>

                {savedSettings && savedSettings.length > 0 && (
                  <>
                    <div className="flex flex-col space-y-4">
                      <Select onValueChange={handleSelectSettings}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a Saved Configuration" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedSettings.map((settings) => (
                            <SelectItem key={settings.id} value={settings.name}>
                              {settings.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <Stack spacing={2}>
            <Heading >Export Content</Heading >
            <p>Export content from your Sitecore instance</p>
            <div className="">
              <Stack spacing="6">
                <Wrap align="center">
                  <Button size="sm" onClick={runExport}>
                    Run Export
                  </Button>
                  <Button variant="outline" colorScheme="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                    Save Settings
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear All
                  </Button>
                </Wrap>
              </Stack>
            </div>
          </Stack>
        </CardHeader>
        <CardBody className="space-y-6">
          <Stack spacing="4">
            <Card variant="filled" className="rounded-sm border bg-card p-6">
              <Heading size="lg">Filters</Heading >
              {/* Start Items Section */}

              <Stack spacing='6'>
                <Stack spacing='2'>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Start Item(s)</label>
                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" onClick={() => setBrowseContentOpen(true)}>
                        Browse
                      </Button>

                      <Button variant="ghost" size="sm" onClick={() => clearStartItem()}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={startItem}
                    onChange={handleStartItem}
                    placeholder="e.g. {D4D93D21-A8B4-4C0F-8025-251A38D9A04D}"
                    className={'font-mono text-sm ' + (errorStartItem ? 'error' : '')}
                  />
                  {errorStartItem && (
                    <Alert variant="default" className="mt-2">
                      <AlertDescription className="text-xs error">
                        Invalid start item. Start items must be entered as GUID IDs
                      </AlertDescription>
                    </Alert>
                  )}
                  <Alert variant="default" className="mt-2">
                    <AlertDescription className="text-xs">
                      Enter GUIDs of starting nodes separated by commas. Only content beneath these nodes will be
                      exported.
                    </AlertDescription>
                  </Alert>
                </Stack>

                {/* Templates Section */}
                <Stack spacing='2'>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Templates</label>
                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" onClick={() => setBrowseTemplatesOpen(true)}>
                        Browse
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setTemplates('')}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={templates}
                    onChange={handleTemplates}
                    placeholder="e.g. {CC92A3D8-105C-4016-8BD7-22162C1ED919}"
                    className={'font-mono text-sm ' + (errorTemplates ? 'error' : '')}
                  />
                  {errorTemplates && (
                    <Alert variant="default" className="mt-2">
                      <AlertDescription className="text-xs error">
                        Invalid template. Templates must be entered as GUID IDs
                      </AlertDescription>
                    </Alert>
                  )}
                  <Alert variant="default" className="mt-2">
                    <AlertDescription className="text-xs">
                      Enter template GUIDs separated by commas. Leave blank to include all templates.
                    </AlertDescription>
                  </Alert>
                </Stack>

                {/* Languages -- eventually replace with a dropdown connected to a GQL language query */}
                <Stack spacing='2'>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Language</label>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setLanguages('')}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={languages}
                    onChange={handleLanguages}
                    placeholder="e.g. en, es-MX"
                    className="text-sm"
                  />
                </Stack>
              </Stack>
            </Card>
            <Card variant="filled" className="rounded-sm border bg-card p-6">
              <Heading size="lg">Data</Heading>
              {/* Fields Section */}
              <Stack spacing='2'>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Fields</label>
                  <div className="flex items-center gap-2">
                    <Button disabled={templates === ''} size="sm" onClick={() => browseFields()}>
                      Browse
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setFields('')}>
                      Clear
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={fields}
                  onChange={handleFields}
                  placeholder="e.g. title, image, taxonomies"
                  className="text-sm"
                />
                {templates === '' &&
                  <Alert variant="default" className="mt-2">
                    <AlertDescription className="text-xs">
                      Select at least one template to Browse
                    </AlertDescription>
                  </Alert>
                }

                <div className="">

                  {availableFields && availableFields.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-medium">Available Fields</label>{' '}
                      <Button variant="outline" size="sm" onClick={() => setFields(availableFields.join(', '))}>
                        Select All
                      </Button>
                      <div className="items-center gap-2 mt-4 fieldsList">
                        {availableFields &&
                          availableFields.map((field, index) => (
                            <p key={index}>
                              <a
                                className={fieldIsSelected(field) ? 'disabled' : ''}
                                onDoubleClick={() => addField(field)}
                              >
                                {field}
                              </a>
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* to do: make collapsible, fix to work fully with Edge */}
                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-medium">Standard Fields</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-template`}
                    checked={includeTemplate}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setIncludeTemplate(event.target.checked === true)}
                    className="mr-2"
                  />
                  <span className="flex-grow">Template</span>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-lang`}
                    checked={includeLang}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setIncludeLang(event.target.checked === true)}
                    className="mr-2"
                  />
                  <span className="flex-grow">Language</span>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-created`}
                    checked={createdDate}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setCreatedDate(event.target.checked === true)}
                    className="mr-2"
                  />
                  <span className="flex-grow">Created Date</span>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-createdBy`}
                    checked={createdBy}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setCreatedBy(event.target.checked === true)}
                    className="mr-2"
                  />
                  <span className="flex-grow">Created By</span>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-updatedDate`}
                    checked={updatedDate}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setUpdatedDate(event.target.checked === true)}
                    className="mr-2"
                  />
                  <span className="flex-grow">Updated Date</span>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-updatedBy`}
                    checked={updatedBy}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setUpdatedBy(event.target.checked === true)}
                    className="mr-2"
                  />
                  <span className="flex-grow">Updated By</span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-medium">Options</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-convertGuids`}
                    checked={convertGuids}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setConvertGuids(event.target.checked === true)}
                    className="mr-2"
                  />
                  <span className="flex-grow">Export Linked Item Names</span>
                </div>
                <Alert variant="default" className="mt-2">
                  <AlertDescription className="text-xs">
                    By default, all fields are exported as raw values. Check this box to export the Name of linked
                    items instead of Guid ID
                  </AlertDescription>
                </Alert>
              </Stack>
            </Card>

            <div className="mt-4 space-y-2">
              <Stack spacing="6">
                <Wrap align="center">
                  <Button size="sm" onClick={runExport}>
                    Run Export
                  </Button>
                  <Button variant="outline" colorScheme="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                    Save Settings
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear All
                  </Button>
                </Wrap>
              </Stack>
            </div>
          </Stack>

          <SaveSettingsModal open={isModalOpen} onOpenChange={setIsModalOpen} onSubmit={handleSaveSettings} />
        </CardBody>
      </Card>
    </>
  );
};
