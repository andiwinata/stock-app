import moment from 'moment';

const stockDataTest = [
    { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
    { date: "20170107", ticker: 'MSFT', open: 11, close: 312 },
    { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
    { date: "20170109", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170112", ticker: 'AMZN', open: 35, close: 456 },
    { date: "20170113", ticker: 'AMZN', open: 42, close: 12 },
];

const isString = (str) => {
    return (typeof str === 'string' || str instanceof String);
};

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

    CACHE_AVAILABILITY: {
        FULL: 'FULL',
        PARTIAL: 'PARTIAL',
        NONE: 'NONE'
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
                let openReq = indexedDB.open(this.config.dbName, 1);

                openReq.onerror = (event) => {
                    reject(`Fail to open indexed DB with name ${this.config.dbName}`);
                };
                openReq.onupgradeneeded = (event) => {
                    this._db = event.target.result;

                    const objectStore = this._db.createObjectStore(this.config.objectStoreName);
                    // create index based on ticker and date
                    // be careful with short circuiting problem
                    // http://stackoverflow.com/questions/12084177/in-indexeddb-is-there-a-way-to-make-a-sorted-compound-query
                    objectStore.createIndex(this.config.tickerDateIndexName, ['ticker', 'date'], { unique: true });

                    objectStore.transaction.oncomplete = (event) => {
                        resolve(this._db);
                    };
                };
                openReq.onsuccess = (event) => {
                    this._db = event.target.result;
                    resolve(this._db);
                };
                openReq.onblocked = (error) => {
                    reject(`opening indexedDB is blocked ${error}`);
                };

            } else {
                // if connection has been opened, resolve the promise
                resolve(this._db);
            }
        });

    },

    /**
     * Get indexedDB for quandl cache
     * will only try to get, if it does not exist it will reject the promise
     */
    getQuandlIndexedDB() {
        return new Promise((resolve, reject) => {
            const openReq = indexedDB.open(this.config.dbName);

            openReq.onupgradeneeded = event => {
                event.target.transaction.abort();
                reject(`IndexedDB with name ${this.config.dbName} does not exits`);
            };
            openReq.onsuccess = event => {
                resolve(openReq.result);
            };
            openReq.error = error => {
                reject(`Error during getting DB with name ${this.config.dbName}`);
            };
            openReq.onblocked = error => {
                reject(`opening indexedDB is blocked ${error}`);
            };
        });
    },

    getTickerObjectStoreKey(stockData) {
        return `${stockData.ticker}${stockData.date}`;
    },

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
                            resolve(putRequest.result);
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
                        resolve(tickersData);
                    }
                };
                cursorReq.onerror = (event) => {
                    reject(`There is an error while getting data for tickerName: ${tickerName}\nWith error: \n${cursorReq.error}`);
                };

            }).catch(error => {
                reject(error);
            });

        });
    },

    cacheStatusFactory(cacheAvailability = this.CACHE_AVAILABILITY.NONE, cacheData = [], dateGaps = []) {
        const validDateGaps = dateGaps.every(gap => 'startDate' in gap && 'endDate' in gap);
        if (!validDateGaps) {
            throw new TypeError(`dateGaps must contain only dateGap object`);
        }

        return {
            cacheAvailability,
            cacheData,
            dateGaps
        };
    },

    dateGapFactory(startDate, endDate) {
        if (!isString(startDate) || !isString(endDate)) {
            throw TypeError(`startDate and endDate must be string`);
        }

        return {
            startDate,
            endDate
        };
    },

    /**
     * Return Promise containing CacheStatus of selectedTickerData
     * It basically returns array of tickerData wrapped in CacheStatus object
     * to know whether the cache is full, partial or empty
     * 
     * @param {String} tickerName 
     * @param {String|moment} fromDate 
     * @param {String|moment} toDate 
     * @returns 
     */
    getCachedTickerData(tickerName, fromDate, toDate) {
        return new Promise((resolve, reject) => {

            fromDate = moment(fromDate);
            toDate = moment(toDate);
            const dateFormat = 'YYYYMMDD';

            // if fromDate and toDate are not valid
            if (fromDate.isAfter(toDate, 'days')) {
                reject(`toDate cannot be before fromDate!`);
                return;
            }

            /**
             * Finding dateGaps in tickerDataArray
             * tickerDataArray must be sorted by date
             * the tickerDataArray also must be containing only 1 ticker type
             * 
             * @param {any} tickerDataArray 
             * @param {string} [dateFormat='YYYYMMDD'] 
             * @returns 
             */
            const getDateGapsInTickerDataArray = (tickerDataArray) => {
                const dateGaps = [];
                // start currentDate from firstDate in tickerDataArray
                let currDate = moment(tickerDataArray[0].date);
                let startDateGap;

                for (let tickerData of tickerDataArray) {

                    if (currDate.diff(tickerData.date) !== 0) {
                        // current item date is not equal to currDate
                        // meaning the current tickerData.date has jumped more than 1 days
                        // so we are entering 'gap range' thus we need to set the currStartDateGap variable
                        // to mark that we are in 'gap range'
                        startDateGap = moment(currDate);

                        // keep increasing currDate until we finally catch up with current tickerData.date
                        while (currDate.diff(tickerData.date) !== 0) {
                            currDate = currDate.add(1, 'days');
                        }

                        // after catching up, add the 'gap' to dateGaps from startDateGap until currentDate - 1
                        dateGaps.push(this.dateGapFactory(
                            startDateGap.format(dateFormat),
                            currDate.subtract(1, 'days').format(dateFormat)
                        ));

                        // resetting the startDateGap variable
                        startDateGap = null;
                    }

                    // continue to next iteration, as well as increasing currentDate
                    currDate = currDate.add(1, 'days');
                }

                return dateGaps;
            };

            /**
             * Function to wrap storedTickerDataArr inside CacheStatus object
             * So aside from returning cached data
             * it also returns the CacheStatus of requested object
             * whether it is cached partially, fully, or no cache at all
             * 
             * @param {[tickerData]} storedTickerDataArr 
             */
            const wrapTickerDataInsideCacheStatus = (storedTickerDataArr) => {
                // if there is no stored data
                if (storedTickerDataArr.length === 0) {
                    return this.cacheStatusFactory(
                        this.CACHE_AVAILABILITY.NONE
                    );
                }

                // if there is stored data
                const firstStoredDate = storedTickerDataArr[0].date;
                const lastStoredDate = storedTickerDataArr[storedTickerDataArr.length - 1].date;

                const startDateDiff = Math.abs(fromDate.diff(firstStoredDate, 'days')); // using absolute to remove negative value
                const endDateDiff = toDate.diff(lastStoredDate, 'days');
                const totalDaysInRequest = toDate.diff(fromDate, 'days') + 1;

                // if startDate of cache and request same AND
                // endDate of cache and request same AND
                // totalStoredData match totalDaysRequested
                // it means the all the requested data actually fully cached
                if (startDateDiff === 0 && endDateDiff === 0 && storedTickerDataArr.length === totalDaysInRequest) {
                    return this.cacheStatusFactory(
                        this.CACHE_AVAILABILITY.FULL,
                        storedTickerDataArr
                    );
                }

                // at this point, it means the requested data is partially cached
                // it can be gap in beginning, end or multiple gaps in middle
                const dateGaps = [];

                // check beginning gap
                // add gap from 'fromDate' to 'firstStoredDate - 1'
                if (startDateDiff !== 0) {
                    dateGaps.push(this.dateGapFactory(
                        fromDate,
                        firstStoredDate.subtract(1, 'days')
                    ));
                }

                // check end gap
                // add gap from 'lastStoredDate + 1' to 'endDate'
                if (endDateDiff !== 0) {
                    dateGaps.push(this.dateGapFactory(
                        lastStoredDate.add(1, 'days'),
                        endDate
                    ));
                }

                // check middle gap
                // if total startDateDiff and endDateDiff and totalStoredData is still not equal to totalDaysInRequest
                // it means there is dateGaps in middle of storedDataArr
                if (startDateDiff + endDateDiff + storedTickerDataArr.length !== totalDaysInRequest) {
                    const middleGaps = getDateGapsInTickerDataArray(storedTickerDataArr);

                    // add middleGaps to dateGaps
                    dateGaps.push.apply(dateGaps, middleGaps);
                }

                // return partial cache status
                return this.cacheStatusFactory(
                    this.CACHE_AVAILABILITY.PARTIAL,
                    storedTickerDataArr,
                    dateGaps
                );
            };

            // make getTickerData request
            this.getTickerData(tickerName, fromDate.format(dateFormat), toDate.format(dateFormat))
                .then(storedTickerDataArr => {
                    // wrap the ticker data
                    const cacheStatusOfStoredTickerData = wrapTickerDataInsideCacheStatus(storedTickerDataArr);
                    // then pass in the cacheStatus result
                    resolve(cacheStatusOfStoredTickerData);
                }).catch(getError => {
                    reject(getError);
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
    },

    deleteQuandlIndexedDB() {
        return new Promise((resolve, reject) => {

            // close connection first if exists
            if (this._db) {
                this._db.close();
            }

            const delRequest = indexedDB.deleteDatabase(this.config.dbName);

            delRequest.onsuccess = (event) => {
                resolve(`Successfully deleted database with name: ${this.config.dbName}`);
            };
            delRequest.onerror = (error) => {
                reject(`Fail to delete databse with name: ${this.config.dbName}, error: ${error}`);
            };
            delRequest.onupgradeneeded = () => {
                reject(`Fail to delete databse with name: ${this.config.dbName} (upgradeneeded)`);
            };
            delRequest.onblocked = () => {
                reject(`Fail to delete database with name: ${this.config.dbName} (blocked), error: ${delRequest.error}`);
            };

        });
    },

};

export default QuandlIndexedDBCache;