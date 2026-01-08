import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useMemo } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AnalyticsChart = ({ transactions }) => {
    const { barData, doughnutData } = useMemo(() => {
        // 1. Group by Month (YYYY-MM) for Bar Chart
        const groupedByMonth = {};
        // 2. Group by Category for Doughnut (Expenses only)
        const groupedByCategory = {};

        transactions.forEach(t => {
            const amt = parseFloat(t.amount);

            // Monthly Grouping
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = { income: 0, expense: 0 };

            if (t.type === 'income') {
                groupedByMonth[monthKey].income += amt;
            } else {
                groupedByMonth[monthKey].expense += amt;

                // Category Grouping (Expenses only)
                if (!groupedByCategory[t.category]) groupedByCategory[t.category] = 0;
                groupedByCategory[t.category] += amt;
            }
        });

        // Prepare Bar Data
        const months = Object.keys(groupedByMonth).sort();
        const barData = {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: months.map(m => groupedByMonth[m].income),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Expenses',
                    data: months.map(m => groupedByMonth[m].expense),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
            ],
        };

        // Prepare Doughnut Data
        const categories = Object.keys(groupedByCategory);
        const doughnutData = {
            labels: categories,
            datasets: [{
                data: categories.map(c => groupedByCategory[c]),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(199, 199, 199, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                ],
                borderWidth: 1,
            }]
        };

        return { barData, doughnutData };
    }, [transactions]);

    const commonOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#e0e0e0' } },
            title: { display: true, color: '#e0e0e0' }
        }
    };

    const barOptions = {
        ...commonOptions,
        plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: 'Monthly Income vs Expenses' } },
        scales: {
            x: { ticks: { color: '#aaaaaa' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: '#aaaaaa' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
    };

    const doughnutOptions = {
        ...commonOptions,
        plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: 'Expense by Category' } }
    };

    return (
        <div className="glass-panel" style={{ padding: '1rem', marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ flex: '1 1 400px', minWidth: '0' }}>
                <Bar options={barOptions} data={barData} />
            </div>
            <div style={{ flex: '1 1 300px', minWidth: '0', maxWidth: '400px', margin: '0 auto' }}>
                <Doughnut options={doughnutOptions} data={doughnutData} />
            </div>
        </div>
    );
};

export default AnalyticsChart;
