const stockDataTest = [
    { date: "1234", ticker: 'MSFT', open: 50, close: 100 },
    { date: "3231", ticker: 'AMZN', open: 25, close: 233 },
];

const QuandlIndexedDBCache = {
    get isIndexedDBExist() {
        const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

        return !!indexedDB;
    },

    config: {
        dbName: "quandl_stock_cache"
    },

    addStockDataToCache(tickerName) {
        if (!this.isIndexedDBExist) {
            window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
            return;
        }

        // open or create database
        let request = indexedDB.open(this.config.dbName, 1);

        request.onerror = function (event) {
            console.error(`Fail to open indexed DB with name ${dbName}`);
        };

        request.onupgradeneeded = function (event) {
            console.log("Upgrade needed");
            let db = event.target.result;

            let objectStore = db.createObjectStore(tickerName, { keyPath: "date" });

            objectStore.transaction.oncomplete = function (event) {
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

            request.onerror = function (event) {
                console.error(`Fail to open indexed DB with name ${this.config.dbName}`);
            };

            request.onupgradeneeded = function (event) {
                console.log('indexedDB upgrade needed');
                this._db = event.target.result;
                callback(this._db);
            };

            request.onsuccess = function (event) {
                console.log('successfully open connection to db');
                this._db = event.target.result;
                callback(this._db);
            };
        } else {
            // if connection has been opened, call the callback
            callback(this._db);
        }

    },

    addTickerData(tickerName, tickerData) {
        this.getOrCreateQuandlIndexedDB((db) => {

            // if objectStore has not yet created
            if (!db.objectStoreNames.contains('tickerName')) {
                db.createObjectStore(tickerName, { keyPath: 'date' });
            }

            const tickerNameStore = db.transaction([tickerName], 'readwrite').objectStore(tickerName);
            tickerData.forEach((value) => {
                tickerNameStore.add(value);
            });
        });
    },

    init() {
        this.assignLegacyIndexedDB();
        this.addStockDataToCache('HELLOTEST2');
        this.addTickerData('hellotest22', stockDataTest);
    }
};

export default QuandlIndexedDBCache;