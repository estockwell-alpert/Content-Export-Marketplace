/* eslint-disable @typescript-eslint/no-explicit-any */

import { ISettings } from "@/models/ISettings";
import { Button, Heading, Icon, Input, Stack, Table, Tbody, Td, Th, Thead, Tr, Wrap } from "@chakra-ui/react";
import { mdiClose, mdiPencilOutline, mdiTrashCanOutline } from "@mdi/js";

import React, { useEffect, useState } from "react";
import { AuthorInfo } from "./AuthorInfo";


export const ManageSavedSettings = () => {
    const [savedSettings, setSavedSettings] = useState<ISettings[]>([]);
    const [deleting, setDeleting] = useState<boolean>();
    const [renaming, setRenaming] = useState<boolean>();
    const [saveName, setSaveName] = useState<string>();
    const [selectedSettings, setSelectedSettings] = useState<ISettings>();

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

    const handleSubmitRename = () => {
        if (!selectedSettings || !saveName) return;
        selectedSettings.name = saveName;

        // update saved settings in storage
        const filteredSettings = savedSettings.filter((settings) => settings.id !== selectedSettings.id);

        // add renamed settings back
        const updatedSavedSettings = [...filteredSettings, selectedSettings];

        setSavedSettings(updatedSavedSettings);
        localStorage.setItem('settings', JSON.stringify(updatedSavedSettings));

        setRenaming(false);
    };

    const handleDelete = () => {
        if (!selectedSettings) return;

        // update saved settings in storage
        const filteredSettings = savedSettings.filter((settings) => settings.id !== selectedSettings.id);

        setSavedSettings(filteredSettings);
        localStorage.setItem('settings', JSON.stringify(filteredSettings));

        setDeleting(false);
    };


    return (
        <>
            <div className="mt-4 mb-6">
                <div>
                    <Stack spacing="4">
                        <Heading>Managed saved settings</Heading>
                        {(!savedSettings || savedSettings.length === 0) && <p>No settings to show</p>}
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>
                                        Settings Name
                                    </Th>
                                    <Th>
                                        Settings
                                    </Th>
                                    <Th></Th>
                                </Tr>
                            </Thead>
                            <Tbody>

                                {savedSettings.map((setting) => (
                                    <Tr key={setting.id}>
                                        <Td>
                                            {setting.name}
                                        </Td>
                                        <Td>
                                            {Object.keys(setting).map(function (key: string) {
                                                const val: any = setting[key];
                                                if (val && key !== "name" && key !== "id") {
                                                    return <p key={key} className="whiteSpaceNoWrap"><b>{key}:</b> {val.toString()}</p>
                                                } else {
                                                    return ''
                                                }
                                            })}
                                        </Td>
                                        <Td>
                                            <Stack spacing="4"><Wrap align="center">
                                                <Button colorScheme="danger" onClick={() => { setSelectedSettings(setting); setDeleting(true); }} className="delete"><Icon className="mr-2"><path d={mdiTrashCanOutline} /></Icon> Delete</Button>
                                                <Button variant="outline" colorScheme="primary" onClick={() => { setSelectedSettings(setting); setRenaming(true); }} className="rename"><Icon className="mr-2"><path d={mdiPencilOutline} /></Icon> Rename</Button>
                                            </Wrap> </Stack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Stack>
                </div>
            </div >


            <div id="save-settings" className={'save-settings modal ' + (renaming ? 'open' : '')}>
                <div className="inner">
                    <div className="px-4 py-4">
                        <Stack spacing="4">

                            <div className="flex items-end justify-between">
                                <Heading size="md">Rename</Heading>
                                <Button className="desktop" variant="ghost" size="sm" onClick={() => setRenaming(false)}>
                                    <Icon><path d={mdiClose} /></Icon>
                                </Button>
                            </div>

                            <label>Enter a new name for &quot;{selectedSettings?.name}&quot;</label>
                            <Input
                                value={saveName}
                                aria-label="Enter a name for the settings"
                                type="text"
                                onChange={(e) => setSaveName(e.target.value)}
                                placeholder="e.g. Whitepapers Export"
                                className={'font-mono text-sm '}
                            />

                            <Wrap align="center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setRenaming(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button disabled={saveName === null || saveName === ""} onClick={handleSubmitRename}>Save Settings</Button>
                            </Wrap>

                        </Stack>
                    </div>
                </div>
            </div >

            <div id="save-settings" className={'save-settings modal ' + (deleting ? 'open' : '')}>
                <div className="inner">
                    <div className="px-4 py-4">
                        <Stack spacing="4">
                            <div className="flex items-end justify-between">
                                <Heading size="md">Delete</Heading>
                                <Button className="desktop" variant="ghost" size="sm" onClick={() => setDeleting(false)}>
                                    <Icon><path d={mdiClose} /></Icon>
                                </Button>
                            </div>
                            <label>Are you sure you want to delete &quot;{selectedSettings?.name}&quot;?</label>
                            <Wrap align="center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setDeleting(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button colorScheme="danger" onClick={handleDelete}>Confirm</Button>
                            </Wrap>

                        </Stack>
                    </div>
                </div>
            </div >
            <AuthorInfo />
        </>
    );
};
