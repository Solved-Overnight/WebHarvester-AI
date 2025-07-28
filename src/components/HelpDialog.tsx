'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from './ui/badge';

export function HelpDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">How to Use Web Harvester Pro</DialogTitle>
          <DialogDescription>
            A quick guide to get you started with scraping data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 text-sm">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Badge>Step 1</Badge>
              <span>Paste a URL</span>
            </h3>
            <p className="text-muted-foreground pl-10">
              Start by pasting the full URL of the website you want to scrape into the input field on the homepage and click "Fetch Content".
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Badge>Step 2</Badge>
              <span>Select Data Points</span>
            </h3>
            <p className="text-muted-foreground pl-10">
              Web Harvester Pro will fetch the website's content and our AI will suggest data collections and points (like "Product Name", "Price", etc.). Simply check the boxes for the data you wish to extract.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Badge>Step 3</Badge>
              <span>Scrape and Download</span>
            </h3>
            <p className="text-muted-foreground pl-10">
              Click the "Scrape" button. Your data will be extracted and displayed in a table. You can then review the data and download it as a CSV file using the "Download CSV" button.
            </p>
          </div>

           <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Badge>Tip</Badge>
              <span>Review Your Activity</span>
            </h3>
            <p className="text-muted-foreground pl-10">
              Your dashboard on the homepage keeps track of your scraping statistics and recent activity. You can quickly re-run a previous scrape by clicking on it.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
