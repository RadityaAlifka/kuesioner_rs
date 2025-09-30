// Fungsi untuk mengonversi data menjadi format CSV
export const convertToCSV = (data: Record<string, any>[]) => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('\"') || value.includes('\n'))) {
          return `\"${value.replace(/\"/g, '\"\"')}\"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
};

// Fungsi untuk men-trigger download file CSV
export const downloadCSV = (data: Record<string, any>[], filename: string) => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};