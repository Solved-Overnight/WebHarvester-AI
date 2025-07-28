'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Cpu, FileText, Loader2, Play, Search, Trash2, CheckSquare, Square } from 'lucide-react';
import { suggestDataPoints, SuggestDataPointsOutput } from '@/ai/flows/suggest-data-points';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import type { ScrapedRow } from '@/app/page';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Checkbox } from './ui/checkbox';

const API_KEY_STORAGE = 'webharvesterpro_api_keys';

type ScrapingWorkspaceProps = {
  domContent: string;
  onScrapingComplete: (data: ScrapedRow[]) => void;
  onReset: () => void;
};

type DataPoint = {
  id: string;
  label: string;
  selector: string;
  attribute?: string;
};

type DataCollection = {
  id: string;
  name: string;
  repeatingElementSelector: string;
  dataPoints: DataPoint[];
};

export default function ScrapingWorkspace({ domContent, onScrapingComplete, onReset }: ScrapingWorkspaceProps) {
  const [isSuggesting, setIsSuggesting] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [collections, setCollections] = useState<DataCollection[]>([]);
  const [selectedDataPointIds, setSelectedDataPointIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const getSuggestions = async () => {
      setIsSuggesting(true);
      setCollections([]);
      setSelectedDataPointIds(new Set());

      let apiKey = '';
      try {
        const savedKeys = localStorage.getItem(API_KEY_STORAGE);
        if (savedKeys) {
            apiKey = JSON.parse(savedKeys).google;
        }
      } catch (error) {
          console.error("Failed to load API keys from localStorage", error);
      }

      if (!apiKey) {
          toast({
              variant: 'destructive',
              title: 'Google AI Key Missing',
              description: 'Please add your Google AI API key in the settings to use the AI features.',
          });
          onReset();
          return;
      }


      try {
        const result: SuggestDataPointsOutput = await suggestDataPoints({ domContent, apiKey });

        // --- VALIDATION STEP ---
        const parser = new DOMParser();
        const doc = parser.parseFromString(domContent, 'text/html');

        const validatedCollections = result.collections.map((collection, collIndex) => {
            // 1. Validate the repeating element selector
            const repeatingElements = doc.querySelectorAll(collection.repeatingElementSelector);
            if (repeatingElements.length === 0) {
                console.warn(`AI suggested an invalid repeating selector, skipping: "${collection.repeatingElementSelector}"`);
                return null;
            }
            
            // 2. Validate data point selectors within the first repeating element
            const firstElement = repeatingElements[0];
            const validatedDataPoints = collection.dataPoints.filter(dp => {
                const elementExists = firstElement.querySelector(dp.selector);
                if (!elementExists) {
                   console.warn(`AI suggested an invalid data point selector, skipping: "${dp.selector}" within "${collection.repeatingElementSelector}"`);
                }
                return !!elementExists;
            });

            if (validatedDataPoints.length === 0) {
                return null; // Don't add a collection if no data points are valid
            }

            return {
                id: `coll-${collIndex}`,
                name: collection.collectionName,
                repeatingElementSelector: collection.repeatingElementSelector,
                dataPoints: validatedDataPoints.map((dp, dpIndex) => ({
                    ...dp,
                    id: `dp-${collIndex}-${dpIndex}`
                })),
            };
        }).filter((c): c is NonNullable<typeof c> => c !== null); // Filter out null collections
        
        setCollections(validatedCollections);

        // Auto-select all points from the first collection by default
        if (validatedCollections.length > 0 && validatedCollections[0].dataPoints.length > 0) {
            const firstCollectionDpIds = validatedCollections[0].dataPoints.map(dp => dp.id);
            setSelectedDataPointIds(new Set(firstCollectionDpIds));
        }

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'AI Suggestion Failed',
          description: error.message || 'Could not get AI suggestions for this content.',
        });
        console.error(error);
      } finally {
        setIsSuggesting(false);
      }
    };

    if (domContent) {
      getSuggestions();
    }
  }, [domContent, toast, onReset]);
  
  const handleToggleDataPoint = (dataPointId: string) => {
    setSelectedDataPointIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dataPointId)) {
            newSet.delete(dataPointId);
        } else {
            newSet.add(dataPointId);
        }
        return newSet;
    });
  };

  const filteredCollections = useMemo(() => 
    collections.map(collection => {
      const filteredDataPoints = collection.dataPoints.filter(dp => 
        dp.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        collection.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { ...collection, dataPoints: filteredDataPoints };
    }).filter(collection => collection.dataPoints.length > 0)
  , [collections, searchTerm]);

  const allVisibleDataPointIds = useMemo(() => {
    return filteredCollections.flatMap(c => c.dataPoints.map(dp => dp.id));
  }, [filteredCollections]);

  const areAllVisibleSelected = useMemo(() => {
    if (allVisibleDataPointIds.length === 0) return false;
    return allVisibleDataPointIds.every(id => selectedDataPointIds.has(id));
  }, [allVisibleDataPointIds, selectedDataPointIds]);

  const handleToggleSelectAll = () => {
    if (areAllVisibleSelected) {
      // Deselect all visible
      setSelectedDataPointIds(prev => {
        const newSet = new Set(prev);
        allVisibleDataPointIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all visible
      setSelectedDataPointIds(prev => new Set([...prev, ...allVisibleDataPointIds]));
    }
  };

  const handleScrape = () => {
    setIsScraping(true);

    setTimeout(() => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(domContent, 'text/html');

            const selectedCollections = collections.filter(coll =>
                coll.dataPoints.some(dp => selectedDataPointIds.has(dp.id))
            );

            if (selectedCollections.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'No Data Points Selected',
                    description: 'Please select at least one data point to scrape.',
                });
                return;
            }

            if (selectedCollections.length > 1) {
                toast({
                    title: 'Multiple Collections Selected',
                    description: `Scraping data for the first collection: "${selectedCollections[0].name}". Multi-collection scraping is not yet supported.`,
                });
            }

            const collectionToScrape = selectedCollections[0];
            const selectedPoints = collectionToScrape.dataPoints.filter(dp =>
                selectedDataPointIds.has(dp.id)
            );

            const repeatingElements = doc.querySelectorAll(collectionToScrape.repeatingElementSelector);

            if (repeatingElements.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'No Elements Found',
                    description: `The selector "${collectionToScrape.repeatingElementSelector}" did not match any elements.`,
                });
                return;
            }

            const scrapedData: ScrapedRow[] = Array.from(repeatingElements).map(element => {
                const row: ScrapedRow = {};
                selectedPoints.forEach(point => {
                    const childEl = element.querySelector(point.selector);
                    let value: string | null = null;
                    if (childEl) {
                        if (point.attribute) {
                            value = childEl.getAttribute(point.attribute);
                        } else {
                            value = childEl.textContent;
                        }
                    }
                    row[point.label] = value ? value.trim() : null;
                });
                return row;
            });

            onScrapingComplete(scrapedData);

        } catch (error) {
            console.error("Scraping error:", error);
            toast({
                variant: 'destructive',
                title: 'Scraping Failed',
                description: 'An error occurred while parsing the data.',
            });
        } finally {
            setIsScraping(false);
        }
    }, 50); // Small timeout to allow UI to update to "isScraping" state
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
      <div className="lg:col-span-1">
        <Card className="shadow-lg h-full border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Cpu className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">AI Suggestions</CardTitle>
            </div>
            <CardDescription>Select the data points you want to extract.</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuggesting ? (
               <div className="space-y-4">
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
            <>
              <div className="flex gap-2 mb-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                   <Button variant="outline" onClick={handleToggleSelectAll} className="gap-2" disabled={allVisibleDataPointIds.length === 0}>
                     {areAllVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                     <span>{areAllVisibleSelected ? 'Deselect' : 'Select'} All</span>
                  </Button>
              </div>


              <ScrollArea className="h-[400px] pr-4 -mr-4">
                 <Accordion type="multiple" defaultValue={collections.map(c => c.id)} className="w-full">
                  {filteredCollections.map((collection) => (
                    <motion.div
                        key={collection.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                    <AccordionItem value={collection.id} className="border rounded-lg mb-2 bg-secondary/30 px-3">
                        <AccordionTrigger className="hover:no-underline">
                            <p className="font-semibold text-base">{collection.name}</p>
                        </AccordionTrigger>
                        <AccordionContent>
                             <div className="space-y-2 py-2">
                                {collection.dataPoints.map(point => (
                                    <Label key={point.id} htmlFor={point.id} className="flex items-center gap-4 p-3 rounded-md hover:bg-primary/10 cursor-pointer transition-colors">
                                        <Checkbox 
                                            id={point.id}
                                            checked={selectedDataPointIds.has(point.id)}
                                            onCheckedChange={() => handleToggleDataPoint(point.id)}
                                        />
                                        <div className="text-sm flex-grow">
                                            <p className="font-medium text-foreground">{point.label}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{point.selector}</code>
                                                {point.attribute && (
                                                    <Badge variant="outline">{point.attribute}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </Label>
                                ))}
                             </div>
                        </AccordionContent>
                    </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
                {filteredCollections.length === 0 && collections.length > 0 && (
                  <p className="text-muted-foreground text-center py-8">No matching items found.</p>
                )}
                {collections.length === 0 && !isSuggesting && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Collections Found</AlertTitle>
                    <AlertDescription>
                      The AI couldn't identify any valid data collections on this page. This can happen with very complex or unusual layouts.
                    </AlertDescription>
                  </Alert>
                )}
              </ScrollArea>
              </>
            )}
             <Separator className="my-6" />
             <div className="flex items-center gap-2">
                <Button onClick={handleScrape} className="w-full text-base py-6" disabled={isScraping || selectedDataPointIds.size === 0}>
                    {isScraping ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Play className="mr-2 h-5 w-5" />
                    )}
                    {isScraping ? 'Scraping...' : `Scrape ${selectedDataPointIds.size} Data Points`}
                </Button>
                 <Button onClick={onReset} variant="outline" size="icon" className="h-12 w-12 flex-shrink-0">
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">Start Over</span>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="shadow-lg h-full border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">DOM Content Preview</CardTitle>
            </div>
            <CardDescription>A preview of the fetched website's raw HTML content.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] border rounded-md bg-secondary/20 p-4">
              <pre className="text-sm whitespace-pre-wrap break-all">
                <code>{domContent}</code>
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
