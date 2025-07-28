'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const API_KEY_STORAGE = 'webharvesterpro_api_keys';

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      try {
        const savedKeys = localStorage.getItem(API_KEY_STORAGE);
        if (savedKeys) {
          const { google } = JSON.parse(savedKeys);
          setGoogleApiKey(google || '');
        }
      } catch (error) {
        console.error("Failed to load API keys from localStorage", error);
      }
    }
  }, [open]);

  const handleSave = () => {
    try {
      const keys = { google: googleApiKey };
      localStorage.setItem(API_KEY_STORAGE, JSON.stringify(keys));
      toast({
        title: 'Settings Saved',
        description: 'Your API key has been saved successfully.',
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to save API keys to localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Error Saving Settings',
        description: 'Could not save your API key.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your API keys here. Your key is saved securely in your browser's local storage.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="google-api-key" className="text-right">
              Google AI
            </Label>
            <Input
              id="google-api-key"
              type="password"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              className="col-span-3"
              placeholder="Enter your Google AI API key"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
