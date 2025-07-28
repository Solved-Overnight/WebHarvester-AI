export function convertToCSV<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const replacer = (key: string, value: any) => (value === null ? '' : value);

  const csv = [
    headers.join(','), // header row
    ...data.map((row) =>
      headers
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    ),
  ].join('\r\n');

  return csv;
}
