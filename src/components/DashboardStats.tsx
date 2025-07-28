'use client';

import { BarChart, TrendingUp, Rows, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ScrapingStats } from '@/app/page';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

type DashboardStatsProps = {
  stats: ScrapingStats;
  onClearStats: () => void;
};

const StatCard = ({ icon, title, value, description }: { icon: React.ReactNode, title: string, value: string, description?: string }) => (
  <Card className="bg-secondary/30 hover:bg-secondary/50 transition-colors">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

export default function DashboardStats({ stats, onClearStats }: DashboardStatsProps) {
    const { totalScrapes, totalRows } = stats;
    const avgRowsPerScrape = totalScrapes > 0 ? (totalRows / totalScrapes).toFixed(1) : '0';

    return (
        <Card className="h-full shadow-lg border-primary/20">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <BarChart className="h-6 w-6 text-primary" />
                        <CardTitle className="text-2xl">Statistics</CardTitle>
                    </div>
                    <CardDescription>An overview of your scraping activity.</CardDescription>
                </div>
                 {totalScrapes > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8 flex-shrink-0">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Clear All</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all of your
                            scraping statistics.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onClearStats}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard 
                        icon={<TrendingUp className="h-4 w-4" />}
                        title="Total Scrapes"
                        value={totalScrapes.toLocaleString()}
                        description="The total number of times you've scraped a URL."
                    />
                    <StatCard
                        icon={<Rows className="h-4 w-4" />}
                        title="Total Rows Extracted"
                        value={totalRows.toLocaleString()}
                        description="The sum of all rows extracted from all scrapes."
                     />
                    <StatCard
                        icon={<BarChart className="h-4 w-4" />}
                        title="Avg. Rows / Scrape"
                        value={avgRowsPerScrape}
                        description="The average number of data rows per scrape."
                    />
                </div>
                 {totalScrapes === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No activity yet. Scrape your first website to see stats here!</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
