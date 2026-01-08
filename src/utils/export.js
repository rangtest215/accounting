export const exportToCSV = (transactions, filename = 'transactions.csv') => {
    if (!transactions || transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }

    // Define columns
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];

    // Map data to rows
    const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.category,
        t.amount,
        t.note ? `"${t.note.replace(/"/g, '""')}"` : '' // Escape quotes in notes
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
