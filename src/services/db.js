import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc,
    serverTimestamp,
    getDocs,
    writeBatch,
    where
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "records";

// [Agent-DB] & [Agent-BE] Logic
// Path: /users/{uid}/records/{recordId}

export const addTransaction = async (uid, data) => {
    if (!uid) throw new Error("User not authenticated");
    try {
        const userRecordsRef = collection(db, "users", uid, COLLECTION_NAME);
        await addDoc(userRecordsRef, {
            ...data,
            amount: Number(data.amount),
            createdAt: serverTimestamp(),
            date: data.date ? new Date(data.date) : new Date(),
        });
    } catch (error) {
        console.error("Error adding transaction:", error);
        throw error;
    }
};

export const subscribeTransactions = (uid, callback) => {
    if (!uid) return () => { };

    const userRecordsRef = collection(db, "users", uid, COLLECTION_NAME);
    const q = query(userRecordsRef, orderBy("date", "desc"));

    return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // convert timestamp to Date object for easier handling
            date: doc.data().date?.toDate?.() || new Date(doc.data().date)
        }));
        callback(records);
    });
};

export const deleteTransaction = async (uid, id) => {
    if (!uid) throw new Error("User not authenticated");
    try {
        const docRef = doc(db, "users", uid, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting transaction:", error);
        throw error;
    }
};

// Category Management
export const addCategory = async (uid, name) => {
    if (!uid) throw new Error("User not authenticated");
    const normalizedName = name.trim();

    try {
        const colRef = collection(db, "users", uid, "categories");
        const q = query(colRef, where("name", "==", normalizedName));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            console.log(`Category "${normalizedName}" already exists.`);
            return; // Already exists, do nothing
        }

        await addDoc(colRef, {
            name: normalizedName,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding category:", error);
        throw error;
    }
};

export const subscribeCategories = (uid, callback) => {
    if (!uid) return () => { };

    const colRef = collection(db, "users", uid, "categories");
    const q = query(colRef, orderBy("createdAt", "asc"));

    return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(categories);
    });
};
export const deleteCategory = async (uid, categoryId) => {
    console.log(`[db.js] Attempting to delete category: uid=${uid}, categoryId=${categoryId}`);
    if (!uid) throw new Error("User not authenticated");
    try {
        const docRef = doc(db, "users", uid, "categories", categoryId);
        await deleteDoc(docRef);
        console.log(`[db.js] Successfully deleted category ${categoryId}`);
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
};

export const seedDefaults = async (uid) => {
    if (!uid) return;
    const defaults = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Housing', 'Salary', 'Other'];
    const colRef = collection(db, "users", uid, "categories");

    try {
        const snapshot = await getDocs(colRef);

        // 1. Deduplicate existing
        const seen = new Set();
        const batch = writeBatch(db);
        let hasDuplicates = false;

        // Use a map to track unique names to correct casing if needed, but for now simple Set
        // Sort optional but good to keep oldest

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const name = data.name;
            if (seen.has(name)) {
                batch.delete(doc.ref);
                hasDuplicates = true;
            } else {
                seen.add(name);
            }
        });

        if (hasDuplicates) {
            await batch.commit();
            console.log("Cleaned up duplicate categories");
        }

        // 2. Seed only if completely empty
        if (seen.size === 0) {
            const promises = defaults.map(name => addDoc(colRef, {
                name,
                createdAt: serverTimestamp()
            }));
            await Promise.all(promises);
            console.log("Seeded default categories (clean slate)");
        }
    } catch (error) {
        console.error("Error managing categories:", error);
    }
};
