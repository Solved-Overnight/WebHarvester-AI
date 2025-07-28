'use client';

import { History, Link2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { RecentScrape } from '@/app/page';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type RecentScrapesProps = {
  scrapes: RecentScrape[];
  onScrapeClick: (url: string) => void;
  onClearAll: () => void;
};

export default function RecentScrapes({ scrapes, onScrapeClick, onClearAll }: RecentScrapesProps) {
  return (
    <Card className="h-full shadow-lg border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Recent Activity</CardTitle>
            </div>
            {scrapes.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Clear All</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all of your
                            recent scrape history.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onClearAll}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        <CardDescription>Your last few scraping sessions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[240px] -mr-4">
           <div className="space-y-2 pr-4">
              {scrapes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground py-20">
                  <p>Your recent scraping activity will appear here.</p>
                </div>
              ) : (
                scrapes.map((scrape, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50">
                      <div className="flex-grow overflow-hidden pr-4">
                         <p className="text-sm font-semibold truncate text-foreground">{scrape.title}</p>
                         <button
                          onClick={() => onScrapeClick(scrape.url)}
                          className="text-xs text-left text-primary hover:underline truncate w-full"
                        >
                          {scrape.url}
                        </button>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span>{formatDistanceToNow(new Date(scrape.scrapedAt), { addSuffix: true })}</span>
                          <Badge variant="outline">{scrape.rowCount} rows</Badge>
                        </div>
                      </div>
                       <Button variant="ghost" size="icon" onClick={() => onScrapeClick(scrape.url)} className="flex-shrink-0">
                            <Link2 className="h-4 w-4" />
                            <span className="sr-only">Scrape Again</span>
                        </Button>
                    </div>
                  ))
              )}
           </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
