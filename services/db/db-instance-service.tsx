// DbService.ts
import SQLite, { SQLiteDatabase } from "react-native-sqlite-storage";


SQLite.enablePromise(true); // enable promise-based API

class DbService {
    private static instance: DbService; // holds the ONE instance
    private dbConnection: SQLiteDatabase | null = null;

    // Private constructor so you can't use `new DbService()` outside
    private constructor() {}

    /** Get the singleton instance */
    public static getInstance(): DbService {
        if (!DbService.instance) {
            DbService.instance = new DbService();
        }
        return DbService.instance;
    }

    /** Initialize DB — only runs if not already connected */
    public async init(): Promise<void> {
        if (this.dbConnection) {
            console.log("ℹ️ DB already initialized");
            return;
        }

        try {
            this.dbConnection = await SQLite.openDatabase({
                name: "MyBareApp.db",
                location: "default",
            });
            // await this.dbConnection.executeSql("PRAGMA foreign_keys = ON;");
            console.log("✅ Database connected");
        } catch (error) {
            console.error("❌ Failed to open DB:", error);
            throw error;
        }
    }

    /** Get DB connection — throws if init() was never called */
    public getConnection(): any {
        if (!this.dbConnection) {
            throw new Error("❌ DB not initialized. Call init() first.");
        }
        return this.dbConnection;
    }
}

export default DbService;
