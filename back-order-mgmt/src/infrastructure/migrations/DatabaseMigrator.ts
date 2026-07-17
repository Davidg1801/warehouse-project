import type { Pool } from "../../../node_modules/@types/pg/index.js";

export class DatabaseMigrator {
    constructor(private readonly pool : Pool) {}

    async migrateUp() : Promise<void>
    {
        const script = `
            CREATE TABLE IF NOT EXISTS Orders (
                Uuid UUID PRIMARY KEY,
                Data JSONB NOT NULL
            );
        `;

        try {
            await this.pool.query(script);
            console.log("Migration: 'Orders' table created successfully.");
        } catch (error) {
            console.error("Error during migration (migrateUp).");
            throw error;
        }
    }

    async migrateDown() : Promise<void>
    {
        const script = `DROP TABLE IF EXISTS Orders;`;
        try {
            await this.pool.query(script);
            console.log("Migration: 'Orders' table dropped successfully.");
        } catch (error) {
            console.error("Error during migration (migrateDown).");
            throw error;
        }
    }
}