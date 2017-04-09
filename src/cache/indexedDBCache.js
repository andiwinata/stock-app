const stockDataTest = [
    { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
    { date: "20170107", ticker: 'MSFT', open: 11, close: 312 },
    { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
    { date: "20170109", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170112", ticker: 'AMZN', open: 35, close: 456 },
    { date: "20170113", ticker: 'AMZN', open: 42, close: 12 },
];

const QuandlIndexedDBCache = {
    get isIndexedDBExist() {
        const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

        return !!indexedDB;
    },

    config: {
        dbName: "quandlStockCache",
        objectStoreName: "tickerObjectStore",
        tickerDateIndexName: 'tickerDate'
    },

    assignLegacyIndexedDB() {
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || { READ_WRITE: "readwrite" }; // This line should only be needed if it is needed to support the object's constants for older browsers
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    },

    getOrCreateQuandlIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!this.isIndexedDBExist) {
                window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
                reject("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
                return;
            }

            // check if connection to db has not yet created
            if (!this._db) {
                // open or create database
                let request = indexedDB.open(this.config.dbName, 1);

                request.onerror = (event) => {
                    console.error(`Fail to open indexed DB with name ${this.config.dbName}`);
                    reject(`Fail to open indexed DB with name ${this.config.dbName}`);
                };

                request.onupgradeneeded = (event) => {
                    console.log('indexedDB upgrade needed');

                    this._db = event.target.result;

                    const objectStore = this._db.createObjectStore(this.config.objectStoreName);
                    // be careful with short circuiting problem
                    // http://stackoverflow.com/questions/12084177/in-indexeddb-is-there-a-way-to-make-a-sorted-compound-query
                    objectStore.createIndex(this.config.tickerDateIndexName, ['ticker', 'date'], { unique: true });

                    objectStore.transaction.oncomplete = (event) => {
                        resolve(this._db);
                    };
                };

                request.onsuccess = (event) => {
                    console.log('successfully open connection to db');
                    this._db = event.target.result;
                    resolve(this._db);
                };
            } else {
                // if connection has been opened, resolve the promise
                resolve(this._db);
            }
        });

    },

    getTickerObjectStoreKey(stockData) {
        return `${stockData.ticker}${stockData.date}`;
    },

    // TODO define what data structure will be passed in
    putTickerData(tickerData) {
        return new Promise((resolve, reject) => {

            this.getOrCreateQuandlIndexedDB().then((db) => {
                const tickerObjectStore = db.transaction([this.config.objectStoreName], 'readwrite')
                    .objectStore(this.config.objectStoreName);

                // put all promises for putting data into indexed db
                const putPromises = [];

                tickerData.forEach((tickerValue) => {
                    putPromises.push(new Promise((resolve, reject) => {
                        // create ticker key so later on the old cache can be replaced by using same key
                        const putRequest = tickerObjectStore.put(
                            tickerValue,
                            this.getTickerObjectStoreKey(tickerValue)
                        );
                        putRequest.onsuccess = (event) => {
                            resolve(event.target.result);
                        };
                        putRequest.onerror = (event) => {
                            reject(`Fail to put ${tickerValue} to objectStore. ${putRequest.error}`);
                        };
                    }));
                });

                Promise.all(putPromises).then((results) => {
                    resolve(results);
                }).catch((error) => {
                    reject(error);
                });

            }).catch((getDbError) => {
                reject(getDbError);
            });

        });
    },

    getTickerData(tickerName, fromDate, toDate) {
        return new Promise((resolve, reject) => {

            this.getOrCreateQuandlIndexedDB().then((db) => {
                const tickerObjectStore = db.transaction([this.config.objectStoreName], 'readonly')
                    .objectStore(this.config.objectStoreName);
                const dateIndex = tickerObjectStore.index(this.config.tickerDateIndexName);
                const dateBoundRange = IDBKeyRange.bound([tickerName, fromDate], [tickerName, toDate]);

                const cursorReq = dateIndex.openCursor(dateBoundRange);
                const tickersData = [];

                cursorReq.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        tickersData.push(cursor.value);
                        cursor.continue();
                    } else {
                        console.log(`Finish traversing using the cursors`);
                        resolve(tickersData);
                    }
                };

                cursorReq.onerror = (event) => {
                    console.error(`There is an error while getting data for tickerName: ${tickerName}\nWith error: \n${cursorReq.error}`);
                    reject(cursorReq.error);
                };

            }).catch((getDbError) => {
                reject(getDbError);
            });

        });
    },

    init() {
        this.assignLegacyIndexedDB();
        this.putTickerData(stockDataTest).then((msg) => {
            this.testGetTickerData();
        })
    },

    testGetTickerData() {
        this.getTickerData('AMZN', '20170101', '20170109').then((data) => {
            console.log('GET TICKER DATA:', data);
        });
    }
};

export default QuandlIndexedDBCache;