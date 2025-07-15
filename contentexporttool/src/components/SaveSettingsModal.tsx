/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { ISettings } from '@/models/ISettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/dialog';
import { FormField, FormItem, FormMessage } from '@/ui/form';
import { FormLabel, FormControl, Input, Button } from '@chakra-ui/react';
import { AlertDialog } from '@radix-ui/react-alert-dialog';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const formSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  });
type FormValues = z.infer<typeof formSchema>;

interface InstanceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Omit<ISettings, 'id' | 'createdAt'>) => void;
}

export const SaveSettingsModal = ({ open, onOpenChange, onSubmit }: InstanceSettingsModalProps) => {


  const [savedSettings, setSavedSettings] = useState<ISettings[]>([]);
  const [showOverwrite, setShowOverwrite] = useState<boolean>(false);

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
  const handleSubmit = (formData: any) => {
    setShowOverwrite(false);
    
    const name = formData.get("name");

    const setting = savedSettings.find((setting) => setting.name === name);

    if (setting && !showOverwrite) {
      setShowOverwrite(true);
    } else {
        const values: FormValues = {
            name: name
        }
      onSubmit(values);
      alert('Saved!');
    }
  };

  const cancelSave = () => {
    setShowOverwrite(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Save Settings</DialogTitle>
        </DialogHeader>

          <form action={handleSubmit} className="space-y-6">
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Whitepaper Export" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!showOverwrite ? (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    cancelSave();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Settings</Button>
              </DialogFooter>
            ) : (
              <DialogFooter>
                <AlertDialog>Settings with this name already exist! Do you want to overwrite?</AlertDialog>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    cancelSave();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Yes, Overwrite</Button>
              </DialogFooter>
            )}
          </form>
      </DialogContent>
    </Dialog>
  );
};
