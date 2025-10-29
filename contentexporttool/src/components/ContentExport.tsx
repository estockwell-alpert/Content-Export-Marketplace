/* eslint-disable @typescript-eslint/no-explicit-any */
import { IContentNode } from "@/models/IContentNode";
import { ISettings } from "@/models/ISettings";
import { GenerateContentExport, GetAvailableFields } from "@/services/contentExportUtil";
import { convertStringToGuid, hasWindow, validateGuid } from "@/utils/helpers";
import { Card, Button, Textarea, Alert, AlertDescription, Checkbox, Heading, CardBody, Stack, Wrap, Select, Icon, AlertIcon, useToast } from "@chakra-ui/react";
import { ChangeEvent, FC, useCallback, useEffect, useRef, useState } from "react";
import { Root, createRoot } from "react-dom/client";
import { ContentBrowseModal } from "./ContentBrowseModal";
import { ApplicationContext, ClientSDK } from "@sitecore-marketplace-sdk/client";
import { SaveSettingsModal } from "./SaveSettingsModal";
import { FieldBrowseModal } from "./FieldBrowseModal";
import { AuthorInfo } from "./AuthorInfo";
import { mdiCheckCircleOutline, mdiChevronDown, mdiChevronUp, mdiTrayArrowDown } from '@mdi/js'
import React from "react";

interface ExportToolProps {
  appContext: ApplicationContext | null,
  client: ClientSDK | null,
  siteLanguages: string[]
}

export const ExportTool: FC<ExportToolProps> = ({ appContext, client, siteLanguages }) => {
  const [selectedSettingIndex, setSelectedSettingIndex] = useState<number>(0);
  const [selectedSettings, setSelectedSettings] = useState<string>('');
  const [startItem, setStartItem] = useState<string>('');
  const [templatesStartItem, setTemplatesStartItem] = useState<string>();
  const [templates, setTemplates] = useState<string>('');
  const [fields, setFields] = useState<string>();
  const [languages, setLanguages] = useState<string>();
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState<number>();
  const [createdDate, setCreatedDate] = useState<boolean>(false);
  const [createdBy, setCreatedBy] = useState<boolean>(false);
  const [updatedDate, setUpdatedDate] = useState<boolean>(false);
  const [updatedBy, setUpdatedBy] = useState<boolean>(false);
  const [convertGuids, setConvertGuids] = useState<boolean>(false);
  const [includeTemplate, setIncludeTemplate] = useState<boolean>(false);
  const [allFields, setAllFields] = useState<boolean>(false);
  const [inheritors, setInheritors] = useState<boolean>(false);
  const [includeLang, setIncludeLang] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedSettings, setSavedSettings] = useState<ISettings[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>();
  const [errorStartItem, setErrorStartItem] = useState<boolean>(false);
  const [errorTemplates, setErrorTemplates] = useState<boolean>(false);
  const [browseContentOpen, setBrowseContentOpen] = useState<boolean>(false);
  const [browseTemplatesOpen, setBrowseTemplatesOpen] = useState<boolean>(false);
  const [browseFieldsOpen, setBrowseFieldsOpen] = useState<boolean>(false);
  const [contentMainRoot, setContentMainRoot] = useState<Root>();
  const [currentSelections, setCurrentSelections] = useState<any[]>([]);
  const [currentTemplateSelections, setCurrentTemplateSelections] = useState<any[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const mainHeaderEl = useRef<HTMLDivElement>(null);
  const stickyFooterEl = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const filtersEl = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(true);
  const [filtersHeight, setFiltersHeight] = useState<number>(0);
  const dataEl = useRef<HTMLDivElement>(null);
  const [dataOpen, setDataOpen] = useState<boolean>(true);
  const [dataHeight, setDataHeight] = useState<number>(0);

  const toast = useToast();

  /**
 * Make the nav stick to top of window if scrolled down
 * far enough, and return nav to default state if not
 * @returns null if elements aren't rendered
 */
  const handleScroll = () => {
    if (hasWindow()) {
      if (window.scrollY > navHeight) {
        if (!stickyFooterEl?.current) return;
        if (!isSticky) {
          stickyFooterEl.current.classList.add("sticky");
          setIsSticky(true);
        }
      } else {
        stickyFooterEl?.current?.classList.remove("sticky");
        setIsSticky(false);
      }
    }
  };

  const handleResize = () => {
    calculateSectionHeight(filtersEl, filtersHeight, setFiltersHeight, true);
    calculateSectionHeight(dataEl, dataHeight, setDataHeight, true);
  }

  const scrollCallback = useCallback(handleScroll, [isSticky, navHeight, stickyFooterEl]);

  const calculateNavHeight = useCallback(
    (reset = false) => {
      if (
        mainHeaderEl?.current &&
        mainHeaderEl?.current?.clientHeight &&
        (navHeight == 0 || reset)
      ) {
        setNavHeight(mainHeaderEl?.current?.clientHeight);
      }
    },
    [mainHeaderEl, navHeight]
  );

  const calculateSectionHeight = useCallback((ref: React.RefObject<HTMLDivElement | null>, height: number, setter: React.Dispatch<React.SetStateAction<number>>, reset = false) => {
    if (
      ref?.current &&
      ref?.current?.clientHeight &&
      (height == 0 || reset)
    ) {
      setter(ref?.current?.clientHeight);
      // set height explicitly for first collapse
      if (height > 0) {
        ref.current.style.height = height + "px";
      }
    }
  }, []);

  const resizeCallback = useCallback(handleResize, [calculateSectionHeight, dataHeight, filtersHeight]);

  useEffect(() => {
    calculateNavHeight(true);
    calculateSectionHeight(filtersEl, filtersHeight, setFiltersHeight, true);
    calculateSectionHeight(dataEl, dataHeight, setDataHeight, true);
  }, [calculateNavHeight, calculateSectionHeight, dataHeight, filtersHeight]);

  // set window listeners
  useEffect(() => {
    if (!hasWindow()) return;

    window.addEventListener('scroll', scrollCallback);
    window.addEventListener('resize', resizeCallback)
    return () => {
      window.removeEventListener('scroll', scrollCallback);
      window.removeEventListener('resize', resizeCallback);
    };
  });

  const toggleSection = (ref: React.RefObject<HTMLDivElement | null>, isOpen: boolean, height: number, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (ref && ref?.current) {
      if (isOpen) {
        ref.current.style.height = "0";
      } else {
        ref.current.style.height = height + "px";
      }

      setter(!isOpen);
    }
  }

  const sitecoreRootId = '{11111111-1111-1111-1111-111111111111}-root';

  const emptySettings =
    !startItem &&
    !templates &&
    !fields &&
    !languages &&
    !createdDate &&
    !createdBy &&
    !updatedDate &&
    !updatedBy &&
    !includeTemplate &&
    !includeLang &&
    !convertGuids;

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

  const clearAll = () => {
    // hide download button
    const wrapper = document.getElementById("downloadBtnWrapper");
    if (wrapper) {
      wrapper.classList.add("hidden");
    }

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
    setInheritors(false);
    setAllFields(false);

    // browse modals
    setCurrentSelections([]);
    setCurrentTemplateSelections([]);

    // dropdowns
    setSelectedSettingIndex(0);
    setSelectedSettings('');
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

    const result = await GenerateContentExport(
      appContext,
      client,
      startItem,
      templates,
      inheritors,
      itemFields,
      languages,
      includeTemplate,
      includeLang,
      convertGuids,
      allFields
    );

    if (result.error) {
      setError(true);
      setErrorMessage(result.error.detail);
      toast({
        description:
          "Something went wrong. Please check the error message displayed on the page and the console logs",
        status: "error",
      })
    } else {
      setError(false);
      toast({
        description:
          "Export complete. Click the Download Report button to download the report (right click and open in new window)",
        status: "success",
        isClosable: true,
      })
    }
  };

  const resetTree = React.useCallback(() => {
    if (contentMainRoot) {
      contentMainRoot.render(<ul id={sitecoreRootId}></ul>);
    }
  }, [contentMainRoot]);

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

    if (!templates) {
      alert('Enter at least one template ID in the Templates field');
      return;
    }

    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
      loadingModal.classList.remove("hidden");
    }

    const results = await GetAvailableFields(appContext, client, templates);

    console.log(results);

    if (!results) return;

    setAvailableFields(results);
    setBrowseFieldsOpen(true);

    if (loadingModal) {
      loadingModal.classList.add("hidden");
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

  const handleSaveSettings = (saveName: string) => {
    const settings: ISettings = {
      name: saveName,
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
      allFieldsCheckbox: allFields,
      inheritors: inheritors,
      convertGuids: convertGuids
    };

    // check if setting with name already exists
    const filteredSettings = savedSettings.filter((settings) => settings.name !== saveName);

    // add
    const updatedSavedSettings = [...filteredSettings, settings];

    setSavedSettings(updatedSavedSettings);
    localStorage.setItem('settings', JSON.stringify(updatedSavedSettings));
  };

  const handleSetLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSettingIndex(e.target.selectedIndex);
    setLanguages(e.target.value);
  }

  const handleSelectSettings = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSettingIndex(e.target.selectedIndex);
    setSelectedSettings(e.target.value);

    if (e.target.selectedIndex === 0) {
      clearAll();
      return;
    }

    const setting = savedSettings.find((setting) => setting.name === e.target.value);

    if (!setting) {
      console.log("Something went wrong, couldn't find settings");
      return;
    }

    setStartItem(setting.startItem ?? '');
    setTemplates(setting.templates ?? '');
    setFields(setting.fields);
    setLanguages(setting.languages);
    setIncludeLang(setting.includeLang ?? false);
    setIncludeTemplate(setting.includeTemplate ?? false);
    setCreatedBy(setting.createdBy ?? false);
    setCreatedDate(setting.createdDate ?? false);
    setUpdatedBy(setting.updatedBy ?? false);
    setUpdatedDate(setting.updatedDate ?? false);
    setConvertGuids(setting.convertGuids ?? false);
    setAllFields(setting.allFieldsCheckbox ?? false);
    setInheritors(setting.inheritors ?? false);
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



      <div className="flex items-center gap-6 mb-6 mt-4" ref={mainHeaderEl}>
        <Stack spacing={2} className="grow">
          <Heading >Export content</Heading >
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
              <Wrap spacing="4" align="center" className="download-btn-wrapper hidden" id="downloadBtnWrapper">
                <span className="flex items-center">
                  <Icon color="green" className="mr-2"><path d={mdiCheckCircleOutline} /></Icon>
                  <b>Report generated</b>
                </span>
                <a title="Right click and open link in new tab to download report" id="downloadBtn" className="downloadBtn chakra-button" href="javascript:void(0)">
                  <Icon className="mr-2"><path d={mdiTrayArrowDown} /></Icon> <span>Download Report</span>
                </a>
              </Wrap>
            </Stack>
          </div>
        </Stack>
        <Stack className="grow"></Stack>
        {savedSettings && savedSettings.length > 0 && (
          <Stack>
            <Card variant="filled" className="rounded-sm border bg-card p-6">
              <Stack spacing='2'>
                <Heading size="lg">Saved Settings</Heading >
                <Select className={selectedSettingIndex === 0 ? "unselected" : ""} value={selectedSettings} onChange={handleSelectSettings}>
                  <option value="" key="0">-- Select a saved configuration --</option>
                  {savedSettings.map((settings) => (
                    <option key={settings.id} value={settings.name}>
                      {settings.name}
                    </option>
                  ))}
                </Select>
              </Stack>
            </Card>
          </Stack>
        )}
      </div>

      <div className="space-y-6">
        <Stack spacing="4">
          {error && <Alert status="error">
            <AlertIcon />
            <AlertDescription>Something went wrong: {errorMessage}</AlertDescription>
          </Alert>}
          <Card variant="filled" className="rounded-sm border bg-card p-6">
            <Stack spacing="6">
              <Wrap align="center">
                <Heading size="md">Filters</Heading >
                <Button variant="ghost" onClick={() => toggleSection(filtersEl, filtersOpen, filtersHeight, setFiltersOpen)} >
                  <Icon><path d={filtersOpen ? mdiChevronUp : mdiChevronDown} /></Icon>
                </Button>
              </Wrap>
            </Stack>
            {/* Start Items Section */}
            <div ref={filtersEl} className="toggleSection">
              <Stack spacing='6'>
                <Stack spacing='2'>
                  <div className="flex items-end justify-between">
                    <label className="text-sm font-medium">Start Item(s)</label>
                    <div className="flex items-center gap-2">
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
                  <div className="text-muted-foreground text-xs">
                    Enter GUIDs of starting nodes separated by commas. Only content beneath these nodes will be
                    exported.
                  </div>
                </Stack>

                {/* Templates Section */}
                <Stack spacing='2'>
                  <div className="flex items-end justify-between">
                    <label className="text-sm font-medium">Templates</label>
                    <div className="flex items-center gap-2">
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
                  <div className="text-muted-foreground text-xs">
                    Enter template GUIDs separated by commas. Leave blank to include all templates.
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`checkbox-template`}
                      isChecked={inheritors}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setInheritors(event.target.checked === true)}
                    />
                    <button onClick={() => setInheritors(!inheritors)} className="flex-grow">Include items that inherit these templates</button>
                  </div>


                </Stack>

                <Stack spacing='2'>
                  <div className="flex items-end justify-between">
                    <label className="text-sm font-medium">Language</label>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setLanguages(''); setSelectedLanguageIndex(0) }}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <Select className={selectedLanguageIndex === 0 ? "unselected" : ""} value={languages} onChange={handleSetLanguage}>
                    <option value="" key="0">--</option>
                    {siteLanguages.sort().map((lang, index) => (
                      <option key={index} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </Select>
                </Stack>
              </Stack>
            </div>
          </Card>
          <Card variant="filled" className="rounded-sm border bg-card p-6">
            <Stack spacing="6">
              <Wrap align="center">
                <Heading size="md">Data</Heading>
                <Button variant="ghost" onClick={() => toggleSection(dataEl, dataOpen, dataHeight, setDataOpen)} >
                  <Icon><path d={dataOpen ? mdiChevronUp : mdiChevronDown} /></Icon>
                </Button>
              </Wrap>
            </Stack>
            {/* Start Items Section */}
            <div ref={dataEl} className="toggleSection">
              {/* Fields Section */}
              <Stack spacing='2'>
                <div className="flex items-end justify-between">
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
                  <div className="text-muted-foreground text-xs">
                    Select at least one template to browse fields
                  </div>
                }

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-template`}
                    isChecked={allFields}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setAllFields(event.target.checked === true)}
                  />
                  <button onClick={() => setAllFields(!allFields)} className="flex-grow">Export all fields</button>
                </div>

                <div className="">

                  <FieldBrowseModal availableFields={availableFields ?? []} fields={fields} setFields={setFields} setBrowseContentOpen={setBrowseFieldsOpen} browseContentOpen={browseFieldsOpen}></FieldBrowseModal>
                </div>

                {/* to do: make collapsible, fix to work fully with Edge */}
                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-medium">Standard Fields</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-template`}
                    isChecked={includeTemplate}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setIncludeTemplate(event.target.checked === true)}
                  />
                  <button onClick={() => setIncludeTemplate(!includeTemplate)} className="flex-grow">Template</button>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-lang`}
                    isChecked={includeLang}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setIncludeLang(event.target.checked === true)}
                  />
                  <button onClick={() => setIncludeLang(!includeLang)} className="flex-grow">Language</button>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-created`}
                    isChecked={createdDate}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setCreatedDate(event.target.checked === true)}
                  />
                  <button onClick={() => setCreatedDate(!createdDate)} className="flex-grow">Created Date</button>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-createdBy`}
                    isChecked={createdBy}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setCreatedBy(event.target.checked === true)}
                  />
                  <button onClick={() => setCreatedBy(!createdBy)} className="flex-grow">Created By</button>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-updatedDate`}
                    isChecked={updatedDate}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setUpdatedDate(event.target.checked === true)}
                  />
                  <button onClick={() => setUpdatedDate(!updatedDate)} className="flex-grow">Updated Date</button>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-updatedBy`}
                    isChecked={updatedBy}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setUpdatedBy(event.target.checked === true)}
                  />
                  <button onClick={() => setUpdatedBy(!updatedBy)} className="flex-grow">Updated By</button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-medium">Options</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-convertGuids`}
                    isChecked={convertGuids}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setConvertGuids(event.target.checked === true)}
                  />
                  <button onClick={() => setConvertGuids(!convertGuids)} className="flex-grow">Export Linked Item Names</button>
                </div>
                <div className="text-muted-foreground text-xs">
                  By default, all fields are exported as raw values. Check this box to export the Name of linked
                  items instead of Guid ID. Note that this data is informational and NOT valid for Import
                </div>
              </Stack>
            </div>
          </Card>
        </Stack>

        <SaveSettingsModal open={isModalOpen} emptySettings={emptySettings} onOpenChange={setIsModalOpen} onSubmit={handleSaveSettings} />

        <AuthorInfo />

      </div>

      {/* for spacing */}
      <Card>
        <CardBody>
          <Stack spacing="6">

          </Stack>
        </CardBody>
      </Card>
      <div className={isSticky ? "sticky stickyfooter bg-white pt-3" : "stickyfooter bg-white pt-3"} ref={stickyFooterEl}>
        <div>
          <div className="mb-4 pl-4 space-y-2">
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
        </div>
      </div>
    </>
  );
};
