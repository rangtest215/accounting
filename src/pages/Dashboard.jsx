import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { exportToCSV } from '../utils/export';

import { useState, useEffect, useMemo } from 'react';
import { addTransaction, subscribeTransactions, deleteTransaction } from '../services/db';
import AddTransactionModal from '../components/AddTransactionModal';
import AnalyticsChart from '../components/AnalyticsChart';

const Dashboard = ({ user }) => {
    // ... existing state ...
    const [transactions, setTransactions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showChart, setShowChart] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeTransactions(user.uid, (data) => {
            setTransactions(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);

    // ... handleAdd, handleDelete, handleExport ...
    const handleAdd = async (data) => {
        try {
            await addTransaction(user.uid, data);
        } catch (err) {
            alert("Failed to add record: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this record?")) return;
        try {
            await deleteTransaction(user.uid, id);
        } catch (err) {
            alert("Failed to delete record: " + err.message);
        }
    };

    const handleExport = () => {
        exportToCSV(transactions, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const summary = useMemo(() => {
        // ... existing summary logic ...
        let income = 0;
        let expense = 0;
        transactions.forEach(t => {
            const val = parseFloat(t.amount);
            if (t.type === 'income') income += val;
            else expense += val;
        });
        return { income, expense, total: income - expense };
    }, [transactions]);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h1>Accounting</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {user?.email}
                    </span>
                    <button
                        className="btn-primary"
                        style={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)' }}
                        onClick={() => setShowChart(!showChart)}
                    >
                        {showChart ? 'Hide Chart' : 'Show Chart'}
                    </button>
                    <button
                        className="btn-primary"
                        style={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)' }}
                        onClick={handleExport}
                    >
                        Export CSV
                    </button>
                    <button
                        className="btn-primary"
                        style={{ background: 'var(--accent-expense)' }}
                        onClick={() => signOut(auth)}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div className="glass-panel" style={{ flex: 1, padding: '1.5rem' }}>
                    <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Balance</span>
                    <span style={{ fontSize: '2rem', fontWeight: 700 }}>${summary.total.toLocaleString()}</span>
                </div>
                <div className="glass-panel" style={{ flex: 1, padding: '1.5rem' }}>
                    <span style={{ display: 'block', color: 'var(--accent-income)', fontSize: '0.9rem' }}>Income</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>+${summary.income.toLocaleString()}</span>
                </div>
                <div className="glass-panel" style={{ flex: 1, padding: '1.5rem' }}>
                    <span style={{ display: 'block', color: 'var(--accent-expense)', fontSize: '0.9rem' }}>Expenses</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>-${summary.expense.toLocaleString()}</span>
                </div>
            </div>

            {showChart && <AnalyticsChart transactions={transactions} />}

            <div className="glass-panel" style={{ minHeight: '300px', padding: 0, overflow: 'hidden', marginTop: '2rem' }}>
                {loading ? (
                    <p style={{ padding: '2rem' }}>Loading...</p>
                ) : transactions.length === 0 ? (
                    <div style={{ padding: '3rem' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No records found.</p>
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none' }}>
                        {transactions.map(t => (
                            <li key={t.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem 1.5rem',
                                borderBottom: 'var(--glass-border)'
                            }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 600 }}>{t.category}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {new Date(t.date).toLocaleDateString()} {t.note && `• ${t.note}`}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{
                                        fontWeight: 600,
                                        color: t.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)'
                                    }}>
                                        {t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            opacity: 0.5
                                        }}
                                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                                        onMouseOut={e => e.currentTarget.style.opacity = 0.5}
                                    >
                                        &times;
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <button
                className="btn-primary"
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    fontSize: '1.5rem',
                    boxShadow: 'var(--glass-shadow)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                onClick={() => setIsModalOpen(true)}
            >
                +
            </button>

            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAdd}
                user={user}
            />
        </div>
    );
};

export default Dashboard;
