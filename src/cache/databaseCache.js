
class QuandlIndexedDBCache {

    constructor() {

    }

    get isIndexedDBExist() {
        window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || { READ_WRITE: "readwrite" }; // This line should only be needed if it is needed to support the object's constants for older browsers
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

        return !!window.indexedDB;
    }

    addStockDataToCache(tickerName) {
        if (!isIndexedDBExist) {
            window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
            return;
        }

        const dbName = "quandl_stock_cache";

        // open or create database
        let request = indexedDB.open(dbName, 1);

        request.onerror = function (event) {
            console.error(`Fail to open indexed DB with name ${dbName}`);
        };

        request.onupgradeneeded = function (event) {
            let db = event.target.result;

            let objectStore = db.createObjectStore(tickerName, { keyPath: "date" });

            objectStore.transaction.oncomplete = function (event) {
                let tickerObjectStore = db.transaction(tickerName, "readwrite").objectStore(tickerName);
                // tickerObjectStore.add();
            }
        };
    }
}
