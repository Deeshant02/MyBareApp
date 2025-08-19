import { SQLiteDatabase } from "react-native-sqlite-storage";


export async function createCustomersTable(dbConnection: SQLiteDatabase) {
    const customerTable = `
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY,
            number_prefix TEXT,
            number INTEGER,
            code TEXT,
            first_name TEXT,
            last_name TEXT,
            name_en TEXT,
            gender TEXT,
            dob TEXT,
            mobile TEXT,
            bank_name TEXT,
            bank_branch TEXT,
            bank_account TEXT,
            bank_ifsc TEXT,
            c_rate_option TEXT,
            c_rate_amount REAL,
            b_rate_option TEXT,
            b_rate_amount REAL,
            c_rate_chart TEXT,
            b_rate_chart TEXT,
            milk_type TEXT,
            center INTEGER,
            route TEXT,
            status INTEGER,
            for_vlc TEXT,
            for_vlc_name TEXT,
            for_vlc_short_name TEXT
        )`;

    try {
        debugger;
        // await dbConnection.executeSql(customerTable);
        try {
            console.log("📌 Creating customers table...");
            await dbConnection.executeSql(customerTable);
            console.log("✅ Table created successfully!");
        } catch (error) {
            console.error("❌ Failed to create customers table:", error);
        }
        // await dbConnection.executeSql(
        //     customerTable,
        //     [],
        //     (tx: any, results: any) => { console.log("Query success:", results); },
        //     (error: any) => { console.error("Query error:", error); } // Crucial error callback
        // );
        console.log('customers table created successfully');
    } catch (error) {
        console.error(error);
        throw Error(`Failed to create customers table`);
    }

    return;
}

export async function createCollectionsTable(dbConnection: any) {
    const collectionTable = `CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY,
        date TEXT,
        type TEXT,
        shift TEXT,
        quantity REAL,
        snf REAL,
        fat REAL,
        clr REAL,
        aquantity REAL,
        asnf REAL,
        afat REAL,
        aclr REAL,
        rate REAL,
        amount REAL,
        billed INTEGER,
        key TEXT,
        water REAL,
        temp REAL,
        sample INTEGER,
        sample_status INTEGER,
        status INTEGER,
        center INTEGER,
        customer INTEGER,
        created TEXT,
        updated TEXT,
        dispatch TEXT,
        details TEXT,
        dispatch_info TEXT,
        details_info TEXT,
        r_ws TEXT,
        r_ma TEXT,
        is_kg INTEGER,
        FOREIGN KEY (customer) REFERENCES customers(id)
    );`

    try {
        await dbConnection.executeSql(collectionTable);
        // await dbConnection.transaction((tx: { executeSql: (arg0: string, arg1: never[], arg2: () => void, arg3: (error: any) => void) => void; }) => {
        //     tx.executeSql(
        //         collectionTable,
        //         [],
        //         () => console.log('collection table created successfully'),
        //         (error: any) => console.log('Error creating table: ', error)
        //     );
        // });
        console.log('collection table created successfully');
    } catch (error) {
        console.error(error);
        throw Error(`Failed to create collection table`);
    }
}

export async function getCustomersTableData(dbConnection: any) {
    try {
        const customersData = await dbConnection.executeSql(`SELECT * FROM customers`);
        const customersDataList: any = [];
        customersData?.forEach((result: any) => {
            for (let index = 0; index < result.rows.length; index++) {
                customersDataList.push(result.rows.item(index));
            }
        })
        return customersDataList;
    } catch (error) {
        console.error(error)
        throw Error(`Failed to create tables`)
    }
}

export async function getCollectinsTableData(dbConnection: any, isCustomerData: boolean = false) {
    try {
        let collectionsData = [];
        if (isCustomerData) {
            collectionsData = await dbConnection.executeSql(`SELECT * 
                FROM customers
                INNER JOIN collections
                ON customers.id = collections.customer;`);
        } else {
            collectionsData = await dbConnection.executeSql(`SELECT * FROM collections`);
        }
        const collectionsDataList: any = [];
        collectionsData?.forEach((result: any) => {
            for (let index = 0; index < result.rows.length; index++) {
                collectionsDataList.push(result.rows.item(index));
            }
        })
        return collectionsDataList;
    } catch (error) {
        console.error(error)
        throw Error(`Failed to get Collection table data`)
    }
}

export async function addCustomerEntry(dbConnection: any, customerEntry: any) {
    const insertQuery = `INSERT INTO customers (id, number_prefix, number, code, first_name, 
        last_name, name_en, gender, dob, mobile, bank_name, bank_branch, bank_account, bank_ifsc, 
        c_rate_option, c_rate_amount, b_rate_option, b_rate_amount, c_rate_chart, b_rate_chart, 
        milk_type, center, route, status, for_vlc, for_vlc_name, for_vlc_short_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    const value = [
        customerEntry?.id, 
        customerEntry?.number_prefix, 
        customerEntry?.number, 
        customerEntry?.code, 
        customerEntry?.first_name, 
        customerEntry?.last_name, 
        customerEntry?.name_en, 
        customerEntry?.gender, 
        customerEntry?.dob, 
        customerEntry?.mobile, 
        customerEntry?.bank_name, 
        customerEntry?.bank_branch, 
        customerEntry?.bank_account, 
        customerEntry?.bank_ifsc, 
        customerEntry?.c_rate_option, 
        customerEntry?.c_rate_amount, 
        customerEntry?.b_rate_option, 
        customerEntry?.b_rate_amount, 
        customerEntry?.c_rate_chart, 
        customerEntry?.b_rate_chart, 
        customerEntry?.milk_type, 
        customerEntry?.center, 
        customerEntry?.route, 
        customerEntry?.status, 
        customerEntry?.for_vlc, 
        customerEntry?.for_vlc_name, 
        customerEntry?.for_vlc_short_name
    ];

    try {
        await dbConnection.executeSql(insertQuery, value);
        console.log('data inserted successfully');
    } catch (error) {
        console.error(error)
        throw Error(`Failed to insert data in customers table`)
    }
}

export async function addCollectionEntry(dbConnection: any, collectionEntry: any) {
    const insertCollectionEntry = `INSERT INTO collections (
            id, date, type, shift, quantity, snf, fat, clr, aquantity, asnf, afat, aclr,
            rate, amount, billed, key, water, temp, sample, sample_status, status, center,
            customer, created, updated, dispatch, details, dispatch_info, details_info, r_ws, r_ma, is_kg
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

    const value = [
        collectionEntry?.id, 
        collectionEntry?.date, 
        collectionEntry?.type, 
        collectionEntry?.shift, 
        collectionEntry?.quantity, 
        collectionEntry?.snf, 
        collectionEntry?.fat, 
        collectionEntry?.clr, 
        collectionEntry?.aquantity, 
        collectionEntry?.asnf, 
        collectionEntry?.afat, 
        collectionEntry?.aclr, 
        collectionEntry?.rate, 
        collectionEntry?.amount, 
        collectionEntry?.billed, 
        collectionEntry?.key, 
        collectionEntry?.water, 
        collectionEntry?.temp, 
        collectionEntry?.sample, 
        collectionEntry?.sample_status, 
        collectionEntry?.status, 
        collectionEntry?.center,
        collectionEntry?.customer, 
        collectionEntry?.created, 
        collectionEntry?.updated, 
        collectionEntry?.dispatch, 
        collectionEntry?.details, 
        collectionEntry?.dispatch_info, 
        collectionEntry?.details_info, 
        collectionEntry?.r_ws, 
        collectionEntry?.r_ma, 
        collectionEntry?.is_kg
    ];

    try {
        await dbConnection.executeSql(insertCollectionEntry, value);
        console.log('data inserted successfully');
    } catch (error) {
        console.error(error)
        throw Error(`Failed to insert data in collections table`)
    }
}

export async function updateCustomerEntry(dbConnection: any, customerEntry: any) {
    const updateQuery = `
        UPDATE customers
        SET number_prefix = ?, 
            number = ?, 
            code = ?, 
            first_name = ?, 
            last_name = ?, 
            name_en = ?, 
            gender = ?, 
            dob = ?, 
            mobile = ?, 
            bank_name = ?, 
            bank_branch = ?, 
            bank_account = ?, 
            bank_ifsc = ?, 
            c_rate_option = ?, 
            c_rate_amount = ?, 
            b_rate_option = ?, 
            b_rate_amount = ?, 
            c_rate_chart = ?, 
            b_rate_chart = ?, 
            milk_type = ?, 
            center = ?, 
            route = ?, 
            status = ?, 
            for_vlc = ?, 
            for_vlc_name = ?, 
            for_vlc_short_name = ?
        WHERE id = ?;
        `;

    const value = [
        customerEntry?.number_prefix, 
        customerEntry?.number, 
        customerEntry?.code, 
        customerEntry?.first_name, 
        customerEntry?.last_name, 
        customerEntry?.name_en, 
        customerEntry?.gender, 
        customerEntry?.dob, 
        customerEntry?.mobile,
        customerEntry?.bank_name, 
        customerEntry?.bank_branch, 
        customerEntry?.bank_account, 
        customerEntry?.bank_ifsc,
        customerEntry?.c_rate_option, 
        customerEntry?.c_rate_amount, 
        customerEntry?.b_rate_option, 
        customerEntry?.b_rate_amount, 
        customerEntry?.c_rate_chart, 
        customerEntry?.b_rate_chart,
        customerEntry?.milk_type, 
        customerEntry?.center, 
        customerEntry?.route, 
        customerEntry?.status, 
        customerEntry?.for_vlc, 
        customerEntry?.for_vlc_name, 
        customerEntry?.for_vlc_short_name,
        customerEntry?.id
    ];

    try {
        await dbConnection.executeSql(updateQuery, value);
        console.log('data updated successfully');
    } catch (error) {
        console.error(error)
        throw Error(`Failed to update data in customers table`)
    }
}

export async function updateCollectionEntry(dbConnection: any, collectionEntry: any) {
    const updateQuery = `
        UPDATE collections
        SET
            date = ?,
            type = ?,
            shift = ?,
            quantity = ?,
            snf = ?,
            fat = ?,
            clr = ?,
            aquantity = ?,
            asnf = ?,
            afat = ?,
            aclr = ?,
            rate = ?,
            amount = ?,
            billed = ?,
            key = ?,
            water = ?,
            temp = ?,
            sample = ?,
            sample_status = ?,
            status = ?,
            center = ?,
            customer = ?,
            created = ?,
            updated = ?,
            dispatch = ?,
            details = ?,
            dispatch_info = ?,
            details_info = ?,
            r_ws = ?,
            r_ma = ?,
            is_kg = ?
        WHERE id = ?;
        `;

    const value = [
        collectionEntry?.date,
        collectionEntry?.type,
        collectionEntry?.shift,
        collectionEntry?.quantity,
        collectionEntry?.snf,
        collectionEntry?.fat,
        collectionEntry?.clr,
        collectionEntry?.aquantity,
        collectionEntry?.asnf,
        collectionEntry?.afat,
        collectionEntry?.aclr,
        collectionEntry?.rate,
        collectionEntry?.amount,
        collectionEntry?.billed,
        collectionEntry?.key,
        collectionEntry?.water,
        collectionEntry?.temp,
        collectionEntry?.sample,
        collectionEntry?.sample_status,
        collectionEntry?.status,
        collectionEntry?.center,
        collectionEntry?.customer,
        collectionEntry?.created,
        collectionEntry?.updated,
        collectionEntry?.dispatch,
        collectionEntry?.details,
        collectionEntry?.dispatch_info,
        collectionEntry?.details_info,
        collectionEntry?.r_ws,
        collectionEntry?.r_ma,
        collectionEntry?.is_kg,
        collectionEntry?.id
    ];

    try {
        await dbConnection.executeSql(updateQuery, value);
        console.log('data updated successfully');
    } catch (error) {
        console.error(error)
        throw Error(`Failed to update data in collections table`)
    }
}

export async function syncCustomersData(dbConnection: any, customersDataList: any, serverCustomersList: any) {
    serverCustomersList?.forEach((currCustomer: any) => {
        const index = customersDataList?.findIndex((customersDataList: any) => customersDataList?.id === currCustomer?.id);
        if (index === -1) {
            addCustomerEntry(dbConnection, currCustomer);
        } else {
            updateCustomerEntry(dbConnection, currCustomer);
        }
    })
}

export async function syncCollectionsData(dbConnection: any, collectionsDataList: any, serverCollectionsList: any) {
    serverCollectionsList?.forEach((currCollection: any) => {
        const index = collectionsDataList?.findIndex((collectionsDataList: any) => collectionsDataList?.id === currCollection?.id);
        if (index === -1) {
            addCollectionEntry(dbConnection, currCollection);
        } else {
            updateCollectionEntry(dbConnection, currCollection);
        }
    })
}

export async function removeAllCollections(dbConnection: any) {
    try {
        await dbConnection.executeSql('DELETE FROM collections');
        console.log('data deleted successfully');
    } catch (error) {
        console.error(error)
        throw Error(`Failed to delete data in collections table`)
    }
}