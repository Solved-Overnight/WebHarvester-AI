'use client';

import { BarChart, History, PlusSquare, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsDialog } from '@/components/SettingsDialog';
import { WebScribeIcon } from './icons';
import { HelpDialog } from './HelpDialog';

type HeaderProps = {
  onLogoClick: () => void;
  onNewScrapeClick: () => void;
  onStatsClick: () => void;
  onActivityClick: () => void;
  showNavLinks: boolean;
};

export default function Header({ onLogoClick, onNewScrapeClick, onStatsClick, onActivityClick, showNavLinks }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="mr-auto flex items-center gap-4">
          <button onClick={onLogoClick} className="flex items-center space-x-2">
            <WebScribeIcon className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">Web Harvester Pro</span>
          </button>
           <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={onNewScrapeClick}>
                <PlusSquare className="h-4 w-4 mr-2" />
                New Scrape
            </Button>
            {showNavLinks && (
                 <>
                    <Button variant="ghost" onClick={onStatsClick}>
                        <BarChart className="h-4 w-4 mr-2" />
                        Statistics
                    </Button>
                    <Button variant="ghost" onClick={onActivityClick}>
                        <History className="h-4 w-4 mr-2" />
                        Recent Activity
                    </Button>
                </>
            )}
           </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
           <HelpDialog>
             <Button variant="ghost" size="icon">
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </Button>
           </HelpDialog>
          <SettingsDialog>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </SettingsDialog>
        </div>
      </div>
    </header>
  );
}
