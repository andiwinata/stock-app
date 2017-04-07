import moment from 'moment';

const stockDataTest = [
    { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
    { date: "20170107", ticker: 'MSFT', open: 11, close: 312 },
    { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
    { date: "20170109", ticker: 'AMZN', open: 25, close: 233 },
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

                    const objectStore = this._db.createObjectStore(this.config.objectStoreName, { autoIncrement: true });
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

    // TODO define what data structure will be passed in
    putTickerData(tickerData, tickerName, startDate, endDate, dateFormat = 'YYYYMMDD') {
        return new Promise((resolve, reject) => {

            // check start date end date valiidty
            if (moment(endDate).isBefore(startDate, 'day')) {
                console.error(`End date cannot be before the startDate!`);
                reject(`End date cannot be before the startDate!`);
                return;
            }

            this.getOrCreateQuandlIndexedDB().then((db) => {
                const tickerObjectStore = db.transaction([this.config.objectStoreName], 'readwrite')
                    .objectStore(this.config.objectStoreName);

                // make a Map() containing ticker data with date as its value
                const tickerDataByDate = new Map();
                for (let value of tickerData) {
                    tickerDataByDate.set(value.date, value);
                }

                // put all promises for putting data into indexed db
                const putPromises = [];

                // iterate through startDate and endDate (inclusive)
                // http://stackoverflow.com/questions/17163809/iterate-through-a-range-of-dates-in-nodejs
                for (let currDate = moment(startDate); currDate.diff(endDate, 'days') <= 0; currDate.add(1, 'days')) {
                    const tickerDataOnDate = tickerDataByDate.get(currDate.format(dateFormat));
                    const emptyValue = {
                        date: currDate.format(dateFormat),
                        ticker: tickerName
                    };

                    // if there is ticker data for current date, use it,
                    // otherwise just make empty value to be added to database
                    // so that there will be no missing date gap
                    const putValue = tickerDataOnDate ? tickerDataOnDate : emptyValue;

                    putPromises.push(new Promise((resolve, reject) => {

                        const putRequest = tickerObjectStore.put(putValue);
                        putRequest.onsuccess = (event) => {
                            resolve(putValue);
                        };
                        putRequest.onerror = (event) => {
                            reject(`Fail to put ${putValue} to objectStore. ${putRequest.error}`);
                        };
                    }));

                }

                Promise.all(putPromises).then((results) => {
                    resolve('Put ticker data is done');
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
        this.putTickerData(stockDataTest, 'FB', '20170101', '20170201').then((msg) => {
            this.testGetTickerData();
        }).catch((err) => {
            this.testGetTickerData();
        });

    },

    testGetTickerData() {
        this.getTickerData('FB', '20170101', '20170109').then((data) => {
            console.log('GET TICKER DATA:', data);
        });
    }
};

export default QuandlIndexedDBCache;