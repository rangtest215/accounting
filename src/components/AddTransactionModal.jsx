import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { addCategory, subscribeCategories, deleteCategory, seedDefaults } from '../services/db';

const AddTransactionModal = ({ isOpen, onClose, onAdd, user }) => {
    const [amount, setAmount] = useState('');
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState('');

    const [type, setType] = useState('expense');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Seed defaults and fetch categories
    useEffect(() => {
        if (!user?.uid) return;

        // 1. Ensure defaults exist in DB
        seedDefaults(user.uid);

        // 2. Subscribe to DB categories (which now includes defaults)
        const unsubscribe = subscribeCategories(user.uid, (cats) => {
            setCategories(cats);
            // Set initial category if not set
            if (cats.length > 0 && !category) {
                // Try to find 'Food' or default to first
                const defaultCat = cats.find(c => c.name === 'Food') || cats[0];
                setCategory(defaultCat.name);
            }
        });
        return () => unsubscribe();
    }, [user]); // We keep 'category' out of deps to avoid resetting user selection unless empty

    // Ensure category is valid when list updates
    useEffect(() => {
        if (!category && categories.length > 0) {
            const defaultCat = categories.find(c => c.name === 'Food') || categories[0];
            setCategory(defaultCat?.name || '');
        }
    }, [categories, category]);


    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting transaction:", { amount, category, type, note, date });
        if (!amount) return;

        try {
            await onAdd({
                amount,
                category,
                type,
                note,
                date
            });
            console.log("Transaction saved successfully");
        } catch (err) {
            console.error("Error saving transaction:", err);
            alert("Error saving: " + err.message);
            return;
        }

        // Reset and close
        setAmount('');
        setNote('');
        onClose();
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        if (!user?.uid) {
            console.error("User not found for addCategory");
            return;
        }
        try {
            console.log("Adding category:", newCategoryName);
            await addCategory(user.uid, newCategoryName.trim());
            setCategory(newCategoryName.trim());
            setNewCategoryName('');
            setIsAddingCategory(false);
        } catch (e) {
            console.error("Error adding category:", e);
            alert("Error adding category: " + e.message);
        }
    };

    const handleDeleteCategory = async (catId, catName) => {
        console.log(`[FE] Request delete for ${catName} (${catId})`);
        // Removed confirm dialog for smoother UX and testing
        // if (!confirm(`Delete category "${catName}"?`)) return;
        try {
            await deleteCategory(user.uid, catId);
            if (category === catName) {
                // Reset to first available if deleted
                setCategory(categories.length > 0 ? categories[0].name : '');
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting category: " + e.message);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Add Record</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <button
                            type="button"
                            className="btn-primary"
                            style={{
                                flex: 1,
                                background: type === 'expense' ? 'var(--accent-expense)' : 'var(--bg-secondary)',
                                opacity: type === 'expense' ? 1 : 0.6
                            }}
                            onClick={() => setType('expense')}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            style={{
                                flex: 1,
                                background: type === 'income' ? 'var(--accent-income)' : 'var(--bg-secondary)',
                                opacity: type === 'income' ? 1 : 0.6
                            }}
                            onClick={() => setType('income')}
                        >
                            Income
                        </button>
                    </div>

                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Amount</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0"
                        autoFocus
                        required
                        style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                    />

                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Category</label>

                    {!isAddingCategory ? (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                style={{ flex: 1, marginBottom: 0 }}
                                required
                            >
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '0 1rem', background: 'var(--bg-secondary)', border: 'var(--glass-border)' }}
                                onClick={() => setIsAddingCategory(true)}
                                title="Manage Categories"
                            >
                                ⚙️
                            </button>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0 }}>Manage Categories</h4>
                                <button onClick={() => setIsAddingCategory(false)} type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Done</button>
                            </div>

                            {/* List existing custom categories */}
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', maxHeight: '150px', overflowY: 'auto' }}>
                                {categories.length === 0 && <li style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No categories.</li>}
                                {categories.map(cat => (
                                    <li key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span>{cat.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                            style={{ background: 'none', border: 'none', color: 'var(--accent-expense)', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="New Category..."
                                    style={{ flex: 1, marginBottom: 0 }}
                                />
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleAddCategory}
                                    style={{ padding: '0 1rem' }}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                    />

                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Note (Optional)</label>
                    <input
                        type="text"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Lunch..."
                    />

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', position: 'relative', zIndex: 10 }}>
                        Save Record
                    </button>
                </form>
            </div>
        </div>
    );
};
export default AddTransactionModal;
