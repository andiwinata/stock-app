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

    addStockDataToCache(tickerName) {
        if (!this.isIndexedDBExist) {
            window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
            return;
        }

        // open or create database
        let request = indexedDB.open(this.config.dbName, 1);

        request.onerror = (event) => {
            console.error(`Fail to open indexed DB with name ${this.config.dbName}`);
        };

        request.onupgradeneeded = (event) => {
            console.log("Upgrade needed");
            let db = event.target.result;

            let objectStore = db.createObjectStore(tickerName, { keyPath: "date" });

            objectStore.transaction.oncomplete = (event) => {
                let tickerObjectStore = db.transaction(tickerName, "readwrite").objectStore(tickerName);
                for (let stockData of stockDataTest) {
                    tickerObjectStore.add(stockData);
                }
            }
        };
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

    putTickerData(tickerName, tickerData) {
        this.getOrCreateQuandlIndexedDB((db) => {

            const tickerNameStore = db.transaction([this.config.objectStoreName], 'readwrite').objectStore(this.config.objectStoreName);
            tickerData.forEach((value) => {
                value[this.config.generatedKeyPathName] = `${value.ticker}_${value.date}`;
                tickerNameStore.put(value);
            });
        });
    },

    init() {
        this.assignLegacyIndexedDB();
        // this.addStockDataToCache('HELLOTEST2');
        this.putTickerData('hellotest22', stockDataTest);
    }
};

export default QuandlIndexedDBCache;