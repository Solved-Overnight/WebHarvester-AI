'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

import { fetchUrlContent } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import ScrapingWorkspace from '@/components/ScrapingWorkspace';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, Loader2 } from 'lucide-react';
import { WebScribeIcon } from '@/components/icons';
import DashboardStats from '@/components/DashboardStats';
import RecentScrapes from '@/components/RecentScrapes';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
});

type AppState = 'idle' | 'loadingContent' | 'contentReady' | 'resultsReady';
export type ScrapedRow = Record<string, string | null>;
export type RecentScrape = {
  url: string;
  title: string;
  scrapedAt: string;
  rowCount: number;
};
export type ScrapingStats = {
  totalScrapes: number;
  totalRows: number;
};

const MAX_RECENT_SCRAPES = 5;

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [domContent, setDomContent] = useState<string>('');
  const [scrapedData, setScrapedData] = useState<ScrapedRow[]>([]);
  const [recentScrapes, setRecentScrapes] = useState<RecentScrape[]>([]);
  const [stats, setStats] = useState<ScrapingStats>({ totalScrapes: 0, totalRows: 0 });
  const { toast } = useToast();

  const recentActivityRef = useRef<HTMLDivElement>(null);
  const statisticsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedScrapes = localStorage.getItem('webharvesterpro_recent_scrapes');
      const savedStats = localStorage.getItem('webharvesterpro_stats');
      if (savedScrapes) {
        setRecentScrapes(JSON.parse(savedScrapes));
      }
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });

  const handleFetchContent = useCallback(async (values: z.infer<typeof formSchema>) => {
    setAppState('loadingContent');
    setScrapedData([]);
    setDomContent('');
    try {
      const content = await fetchUrlContent(values.url);
      if (content) {
        setDomContent(content);
        setAppState('contentReady');
      } else {
        throw new Error('Failed to fetch content.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Fetching URL',
        description: 'Could not retrieve content. Please check the URL and try again.',
      });
      setAppState('idle');
    }
  }, [toast]);

  const handleScrapingComplete = useCallback((data: ScrapedRow[]) => {
    setScrapedData(data);
    setAppState('resultsReady');
    
    const urlToSave = form.getValues('url');
    if(!urlToSave) return;
    
    // Extract title from domContent
    let pageTitle = urlToSave; // Default to URL
    if (domContent) {
      try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(domContent, 'text/html');
          const titleTag = doc.querySelector('title');
          if (titleTag && titleTag.textContent) {
              pageTitle = titleTag.textContent.trim();
          }
      } catch (e) {
          console.error("Could not parse title from DOM content", e);
      }
    }

    // Update stats and recent scrapes
    const newScrape: RecentScrape = {
        url: urlToSave,
        title: pageTitle,
        rowCount: data.length,
        scrapedAt: new Date().toISOString()
    };

    const updatedStats: ScrapingStats = {
        totalScrapes: stats.totalScrapes + 1,
        totalRows: stats.totalRows + data.length
    };
    
    const updatedRecentScrapes = [newScrape, ...recentScrapes].slice(0, MAX_RECENT_SCRAPES);

    setStats(updatedStats);
    setRecentScrapes(updatedRecentScrapes);

    try {
        localStorage.setItem('webharvesterpro_stats', JSON.stringify(updatedStats));
        localStorage.setItem('webharvesterpro_recent_scrapes', JSON.stringify(updatedRecentScrapes));
    } catch (error) {
        console.error("Failed to save data to localStorage", error);
    }
  }, [domContent, form, recentScrapes, stats.totalRows, stats.totalScrapes]);
  
  const handleRecentScrapeClick = useCallback((url: string) => {
    form.setValue('url', url);
    handleFetchContent({ url });
  }, [form, handleFetchContent]);
  
  const handleClearAllActivity = useCallback(() => {
    try {
        setRecentScrapes([]);
        localStorage.removeItem('webharvesterpro_recent_scrapes');
        toast({
            title: "Activity Cleared",
            description: "Your recent scraping history has been deleted."
        })
    } catch (error) {
        console.error("Failed to clear data from localStorage", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not clear activity. Please try again."
        })
    }
  }, [toast]);

  const handleClearStats = useCallback(() => {
    try {
        setStats({ totalScrapes: 0, totalRows: 0 });
        localStorage.removeItem('webharvesterpro_stats');
        toast({
            title: "Statistics Cleared",
            description: "Your scraping statistics have been reset."
        })
    } catch (error) {
        console.error("Failed to clear stats from localStorage", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not clear statistics. Please try again."
        })
    }
  }, [toast]);

  const handleReset = useCallback(() => {
    form.reset();
    setAppState('idle');
    setDomContent('');
    setScrapedData([]);
  }, [form]);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onLogoClick={handleReset} 
        onNewScrapeClick={handleReset}
        onStatsClick={() => scrollToRef(statisticsRef)}
        onActivityClick={() => scrollToRef(recentActivityRef)}
        showNavLinks={appState === 'idle'}
      />
      <main className="flex-grow flex flex-col items-center p-4 md:p-8">
        <AnimatePresence mode="wait">
          {appState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-6xl space-y-8"
            >
              <div className="w-full max-w-2xl mx-auto mt-20">
                <Card className="overflow-hidden shadow-2xl bg-gradient-to-tr from-card to-secondary/20 shadow-primary/10 border-primary/20">
                    <CardHeader className="text-center p-8">
                    <motion.div 
                        className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <WebScribeIcon className="h-10 w-10 text-primary" />
                    </motion.div>
                    <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary-foreground to-muted-foreground">Web Harvester Pro</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground pt-2">
                        Paste a URL to instantly extract structured data with AI.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 bg-card/50">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFetchContent)} className="flex flex-col sm:flex-row gap-4">
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormControl>
                                <div className="relative">
                                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="https://example.com/products" {...field} className="pl-10 h-12 text-base" />
                                </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" size="lg" className="h-12 text-base font-semibold">
                            Fetch Content
                        </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div ref={recentActivityRef} className="lg:col-span-1">
                    <RecentScrapes 
                        scrapes={recentScrapes} 
                        onScrapeClick={handleRecentScrapeClick} 
                        onClearAll={handleClearAllActivity}
                    />
                 </div>
                 <div ref={statisticsRef} className="lg:col-span-2">
                    <DashboardStats stats={stats} onClearStats={handleClearStats} />
                 </div>
              </div>

            </motion.div>
          )}

          {appState === 'loadingContent' && (
             <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-lg mt-20"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-semibold text-xl">Fetching website content...</p>
              <p className="text-muted-foreground">Please wait, the AI is warming up.</p>
            </motion.div>
          )}

          {(appState === 'contentReady' || appState === 'resultsReady') && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full"
            >
               <ScrapingWorkspace
                  domContent={domContent}
                  onScrapingComplete={handleScrapingComplete}
                  onReset={handleReset}
                />
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {appState === 'resultsReady' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                className="w-full mt-8"
              >
                <ResultsDisplay data={scrapedData} />
              </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
