const stockDataTest = [
    { date: "1234", ticker: 'MSFT', open: 50, close: 100 },
    { date: "3456", ticker: 'MSFT', open: 11, close: 312 },
    { date: "2345", ticker: 'MSFT', open: 75, close: 551 },
    { date: "4567", ticker: 'AMZN', open: 25, close: 233 },
    { date: "5678", ticker: 'AMZN', open: 35, close: 456 },
    { date: "3231", ticker: 'AMZN', open: 42, close: 12 },
];

const QuandlIndexedDBCache = {
    get isIndexedDBExist() {
        const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

        return !!indexedDB;
    },

    config: {
        dbName: "quandlStockCache",
        objectStoreName: "tickerObjectStore",
        generatedKeyPathName: "tickerDate"
    },

    assignLegacyIndexedDB() {
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || { READ_WRITE: "readwrite" }; // This line should only be needed if it is needed to support the object's constants for older browsers
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    },

    getOrCreateQuandlIndexedDB(callback) {
        if (!this.isIndexedDBExist) {
            window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
            return;
        }

        // check if connection to db has not yet created
        if (!this._db) {
            // open or create database
            let request = indexedDB.open(this.config.dbName, 1);

            request.onerror = (event) => {
                console.error(`Fail to open indexed DB with name ${this.config.dbName}`);
            };

            request.onupgradeneeded = (event) => {
                console.log('indexedDB upgrade needed');

                this._db = event.target.result;

                const objectStore = this._db.createObjectStore(this.config.objectStoreName, { keyPath: this.config.generatedKeyPathName });
                objectStore.createIndex('ticker', 'ticker', { unique: false });
                objectStore.createIndex('date', 'date', { unique: false });

                objectStore.transaction.oncomplete = (event) => {
                    callback(this._db);
                };
            };

            request.onsuccess = (event) => {
                console.log('successfully open connection to db');
                this._db = event.target.result;
                callback(this._db);
            };
        } else {
            // if connection has been opened, call the callback
            callback(this._db);
        }

    },

    putTickerData(tickerData, onFinish) {
        this.getOrCreateQuandlIndexedDB((db) => {
            const tickerObjectStore = db.transaction([this.config.objectStoreName], 'readwrite').objectStore(this.config.objectStoreName);
            
            tickerData.forEach((value) => {
                value[this.config.generatedKeyPathName] = `${value.ticker}_${value.date}`;
                tickerObjectStore.put(value);
            });

            if (onFinish) {
                onFinish();
            }
        });
    },

    getTickerData(tickerName, fromDate, toDate, onFinish) {
        this.getOrCreateQuandlIndexedDB((db) => {
            const tickerObjectStore = db.transaction([this.config.objectStoreName], 'readonly').objectStore(this.config.objectStoreName);
            const dateIndex = tickerObjectStore.index('date');
            const dateBoundRange = IDBKeyRange.bound(fromDate, toDate);

            const cursorReq = dateIndex.openCursor(dateBoundRange);
            const tickersData = [];

            cursorReq.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    // checking if ticker name is the one that is needed
                    if (cursor.value.ticker === tickerName) {
                        tickersData.push(cursor.value);
                    }

                    cursor.continue();
                } else {
                    console.log(`Finish traversing using the cursors`);
                    onFinish(tickersData);
                }
            };

            cursorReq.onerror = (event) => {
                console.error(`There is an error while getting data for tickerName: ${tickerName}\n
                With error: \n${cursorReq.error}`);

                if (onFinish) {
                    onFinish(null);
                }
            };
        });
    },

    init() {
        this.assignLegacyIndexedDB();
        this.putTickerData(stockDataTest);
        // this.getTickerData();
    }
};

export default QuandlIndexedDBCache;