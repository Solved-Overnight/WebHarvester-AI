'use client';

import { useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { convertToCSV } from '@/lib/csv';
import type { ScrapedRow } from '@/app/page';

type ResultsDisplayProps = {
  data: ScrapedRow[];
};

export default function ResultsDisplay({ data }: ResultsDisplayProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return null;
  }

  const headers = Object.keys(data[0] || {});

  const handleDownload = () => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `webscribe_data_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl">Scraped Data</CardTitle>
          <CardDescription>Review and export your extracted data below.</CardDescription>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
           <Button onClick={() => scroll('left')} variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Scroll Left</span>
            </Button>
            <Button onClick={() => scroll('right')} variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
               <span className="sr-only">Scroll Right</span>
            </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
            <Table ref={tableContainerRef}>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header} className="font-bold capitalize whitespace-nowrap">{header.replace(/_/g, ' ')}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {headers.map((header) => (
                      <TableCell key={`${rowIndex}-${header}`} className="whitespace-nowrap">{row[header]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
               <TableCaption>A total of {data.length} rows were extracted.</TableCaption>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
