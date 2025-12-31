import { openDB, DBSchema } from 'idb';

interface VectorDB extends DBSchema {
    vectors: {
        key: string;
        value: {
            id: string;
            embedding: number[];
            metadata: Record<string, unknown>;
            updatedAt: number;
        };
        indexes: { 'by-id': string };
    };
}

const DB_NAME = 'kcc-vector-store';
const DB_VERSION = 1;

export class VectorCache {
    private dbPromise;

    constructor() {
        if (typeof window !== 'undefined') {
            this.dbPromise = openDB<VectorDB>(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    const store = db.createObjectStore('vectors', { keyPath: 'id' });
                    store.createIndex('by-id', 'id');
                },
            });
        }
    }

    async get(id: string) {
        if (!this.dbPromise) return null;
        return (await this.dbPromise).get('vectors', id);
    }

    async set(id: string, embedding: number[], metadata: Record<string, unknown>) {
        if (!this.dbPromise) return;
        await (await this.dbPromise).put('vectors', {
            id,
            embedding,
            metadata,
            updatedAt: Date.now()
        });
    }

    async clear() {
        if (!this.dbPromise) return;
        await (await this.dbPromise).clear('vectors');
    }
}

export const vectorCache = new VectorCache();
