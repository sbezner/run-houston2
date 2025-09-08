import type { ImportError } from './errors';

export function downloadErrorsCsv(errors: ImportError[]): void {
  if (errors.length === 0) {
    return;
  }

  // Create CSV content
  const headers = ['Row Index', 'Field', 'Error Code', 'Message', 'Original Value', 'Hint'];
  const csvContent = [
    headers.join(','),
    ...errors.map(error => [
      error.rowIndex,
      error.field,
      error.code,
      `"${error.message.replace(/"/g, '""')}"`,
      `"${(error.originalValue || '').replace(/"/g, '""')}"`,
      `"${(error.hint || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `import-errors-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
