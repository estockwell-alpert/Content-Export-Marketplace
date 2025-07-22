/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';
import { ISettings } from '@/models/ISettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/dialog';
import { FormField, FormItem, FormMessage } from '@/ui/form';
import { FormLabel, FormControl, Input, Button, Textarea, Card, CardHeader, Heading, CardFooter, CardBody, Stack, Wrap, Alert, AlertDescription, AlertIcon } from '@chakra-ui/react';
import { AlertDialog } from '@radix-ui/react-alert-dialog';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
});
type FormValues = z.infer<typeof formSchema>;

interface InstanceSettingsModalProps {
  open: boolean;
  emptySettings: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (saveName: string) => void;
}

export const SaveSettingsModal = ({ open, onOpenChange, onSubmit, emptySettings }: InstanceSettingsModalProps) => {

  const [saveName, setSaveName] = useState<string>();
  const [savedSettings, setSavedSettings] = useState<ISettings[]>([]);
  const [showOverwrite, setShowOverwrite] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

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

  // Add this line to watch the instanceType field
  const handleSubmit = () => {
    setShowOverwrite(false);

    const setting = savedSettings.find((setting) => setting.name === saveName);

    if (setting && !showOverwrite) {
      setShowOverwrite(true);
    } else {
      onSubmit(saveName ?? "");
      setSaveName('');
      setSaved(true);
    }
  };

  const cancelSave = () => {
    setShowOverwrite(false);
    onOpenChange(false);
    setSaveName('');
    setSaved(false);
  };

  return (
    <>
      <div id="save-settings" className={'save-settings modal ' + (open ? 'open' : '')}>
        <div className="inner">
          <Card>

            <CardBody>
              <Stack spacing="4">
                <Heading>Save Settings</Heading>


                {saved ? (
                  <Wrap align="center">
                    <Alert status="success">

                      <AlertIcon />
                      <AlertDescription>Your settings have been saved!</AlertDescription>

                    </Alert>
                    <Button
                      type="button"
                      variant="solid"
                      onClick={() => {
                        cancelSave();
                      }}
                    >
                      Close
                    </Button>
                  </Wrap>
                ) :
                  (
                    <>
                      <label>Enter a name for the settings</label>
                      <Input
                        value={saveName}
                        aria-label="Enter a name for the settings"
                        type="text"
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="e.g. Whitepapers Export"
                        className={'font-mono text-sm '}
                      />

                      {emptySettings &&
                        <Alert status="error">
                          <AlertIcon />
                          <AlertDescription>You haven&apos;t entered any settings. Are you sure you want to save empty settings?</AlertDescription>
                        </Alert>}
                      {!showOverwrite ? (
                        <Wrap align="center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              cancelSave();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button disabled={saveName === null || saveName === ""} onClick={handleSubmit}>Save Settings</Button>
                        </Wrap>
                      ) : (
                        <>

                          <Alert status="warning">
                            <AlertIcon />
                            <AlertDescription>Settings with this name already exist! Do you want to overwrite?</AlertDescription>
                          </Alert>
                          <Stack spacing="6">
                            <Wrap align="center">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  cancelSave();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button colorScheme="warning" type="submit">Yes, Overwrite</Button>
                            </Wrap>
                          </Stack>
                        </>
                      )}
                    </>
                  )
                }

              </Stack>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};
