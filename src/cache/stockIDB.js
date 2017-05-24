import moment from 'moment';

const isString = (str) => {
    return (typeof str === 'string' || str instanceof String);
};

export const stockDataComparerDate = (a, b) => {
    return moment(a.date).diff(b.date, 'days');
};

export const dateGapComparer = (gap1, gap2, dateFormat) => moment(gap1.startDate, dateFormat).diff(gap2.startDate, 'days');

export const defaultConfig = {
    dbName: 'quandlStockCache',
    objectStoreName: 'tickerObjectStore',
    tickerDateIndexName: 'tickerDate'
};

export const stockIDBDateFormat = 'YYYYMMDD'; // using iso

export const CACHE_AVAILABILITY = {
    FULL: 'FULL',
    PARTIAL: 'PARTIAL',
    NONE: 'NONE'
};

export function cacheStatusFactory(tickerName, cacheAvailability = CACHE_AVAILABILITY.NONE, cacheData = [], dateGaps = []) {
    const validDateGaps = dateGaps.every(gap => 'startDate' in gap && 'endDate' in gap);
    if (!validDateGaps) {
        throw new TypeError(`dateGaps must contain only dateGap object`);
    }

    return {
        tickerName,
        cacheAvailability,
        cacheData,
        dateGaps,
    };
};

export function dateGapFactory(startDate, endDate) {
    if (!isString(startDate) || !isString(endDate)) {
        throw TypeError(`startDate and endDate must be string`);
    }

    return {
        startDate,
        endDate
    };
};

/**
 * Creating a stockIDB
 * all datetime will be passed in iso format 
 * (YYYYMMDD/YYYY-MM-DD/whatever format as long there is YYYY MM DD in correct order)
 * 
 * @export
 * @param {any} overrider           for applying middleware to any functions of stockIDB
 * @param {any} configOverride      to replace any option from defaultConfig
 * @returns 
 */
export default function createStockIDB(overrider, configOverride) {
    function isIndexedDBExist() {
        const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

        return !!indexedDB;
    };

    let _db = null;
    const isoDateFormat = stockIDBDateFormat;
    const config = Object.assign({}, defaultConfig, configOverride);

    function _assignLegacyIndexedDB() {
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || { READ_WRITE: "readwrite" }; // This line should only be needed if it is needed to support the object's constants for older browsers
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    };

    function _init() {
        _assignLegacyIndexedDB();
    };

    /**
     * Adding close event when there is a request to delete database
     * http://stackoverflow.com/questions/11782946/error-when-deleting-indexeddb-database-in-google-chrome-21-problems
     * 
     * @param {any} db 
     */
    function _addCloseEventToDB(db) {
        db.onversionchange = (event) => {
            event.target.close();
        };
    }

    function getConfig(key) {
        return config[key];
    }

    function getOrCreateStockIDB() {
        return new Promise((resolve, reject) => {
            if (!isIndexedDBExist) {
                window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
                reject("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
                return;
            }

            // check if connection to db has not yet created
            if (!_db) {
                // open or create database
                let openReq = indexedDB.open(config.dbName, 1);

                openReq.onerror = (event) => {
                    reject(`Fail to open indexed DB with name ${config.dbName}`);
                };
                openReq.onupgradeneeded = (event) => {
                    _db = event.target.result;
                    _addCloseEventToDB(_db);

                    const objectStore = _db.createObjectStore(config.objectStoreName);
                    // create index based on ticker and date
                    // be careful with short circuiting problem
                    // http://stackoverflow.com/questions/12084177/in-indexeddb-is-there-a-way-to-make-a-sorted-compound-query
                    objectStore.createIndex(config.tickerDateIndexName, ['ticker', 'date'], { unique: true });

                    objectStore.transaction.oncomplete = (event) => {
                        resolve(_db);
                    };
                };
                openReq.onsuccess = (event) => {
                    _db = event.target.result;
                    _addCloseEventToDB(_db);

                    resolve(_db);
                };
                openReq.onblocked = (error) => {
                    reject(`opening indexedDB is blocked ${error}`);
                };

            } else {
                // if connection has been opened, resolve the promise
                resolve(_db);
            }
        });

    };

    /**
     * Get indexedDB for quandl cache
     * will only try to get, if it does not exist it will reject the promise
     */
    function getStockIDB() {
        return new Promise((resolve, reject) => {
            const openReq = indexedDB.open(config.dbName);

            openReq.onupgradeneeded = event => {
                event.target.transaction.abort();
                reject(`IndexedDB with name ${config.dbName} does not exits`);
            };
            openReq.onsuccess = event => {
                resolve(openReq.result);
            };
            openReq.error = error => {
                reject(`Error during getting DB with name ${config.dbName}`);
            };
            openReq.onblocked = error => {
                reject(`opening indexedDB is blocked ${error}`);
            };
        });
    };

    function getTickerObjectStoreKey(stockData) {
        return `${stockData.ticker}${stockData.date}`;
    };

    function putTickerData(tickerData) {
        if (!Array.isArray(tickerData)) {
            tickerData = [tickerData];
        }

        return new Promise((resolve, reject) => {
            getOrCreateStockIDB().then((db) => {
                const tickerObjectStore = db.transaction([config.objectStoreName], 'readwrite')
                    .objectStore(config.objectStoreName);

                // put all promises for putting data into indexed db
                const putPromises = [];

                tickerData.forEach((tickerValue) => {
                    // convert date to the indexedDB format
                    // this is because ideally it should always be in iso format
                    // since for querying later it is using string value
                    tickerValue.date = moment(tickerValue.date).format(isoDateFormat);

                    putPromises.push(new Promise((resolve, reject) => {
                        // create ticker key so later on the old cache can be replaced by using same key
                        const putRequest = tickerObjectStore.put(
                            tickerValue,
                            getTickerObjectStoreKey(tickerValue)
                        );
                        putRequest.onsuccess = (event) => {
                            resolve(putRequest.result);
                        };
                        putRequest.onerror = (event) => {
                            reject(`Fail to put ${JSON.stringify(tickerValue)} to objectStore. ${putRequest.error}`);
                        };
                    }));
                });

                Promise.all(putPromises).then((results) => {
                    resolve(results.sort());
                }).catch((error) => {
                    reject(error);
                });

            }).catch((getDbError) => {
                reject(getDbError);
            });

        });
    };

    function getTickerData(tickerName, fromDate, toDate) {
        // format the date for querying
        fromDate = moment(fromDate).format(isoDateFormat);
        toDate = moment(toDate).format(isoDateFormat);

        return new Promise((resolve, reject) => {
            getOrCreateStockIDB().then((db) => {
                const tickerObjectStore = db.transaction([config.objectStoreName], 'readonly')
                    .objectStore(config.objectStoreName);
                const dateIndex = tickerObjectStore.index(config.tickerDateIndexName);
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
    };

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
    function getCachedTickerData(tickerName, fromDate, toDate) {
        return new Promise((resolve, reject) => {

            fromDate = moment(fromDate);
            toDate = moment(toDate);

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
             * @returns 
             */
            const getDateGapsInTickerDataArray = (tickerDataArray) => {
                const dateGaps = [];
                // start currentDate from firstDate in tickerDataArray
                let currDate = moment(tickerDataArray[0].date);
                let startDateGap;

                for (let tickerData of tickerDataArray) {
                    if (currDate.diff(tickerData.date, 'days') !== 0) {
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
                        dateGaps.push(dateGapFactory(
                            startDateGap.format(isoDateFormat),
                            moment(currDate).subtract(1, 'days').format(isoDateFormat)
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
                    return cacheStatusFactory(
                        tickerName,
                        CACHE_AVAILABILITY.NONE,
                        [],
                        [dateGapFactory(fromDate.format(isoDateFormat), toDate.format(isoDateFormat))]
                    );
                }

                // if there is stored data
                const firstStoredDate = moment(storedTickerDataArr[0].date);
                const lastStoredDate = moment(storedTickerDataArr[storedTickerDataArr.length - 1].date);

                const startDateDiff = Math.abs(fromDate.diff(firstStoredDate, 'days')); // using absolute to remove negative value
                const endDateDiff = toDate.diff(lastStoredDate, 'days');
                const totalDaysInRequest = toDate.diff(fromDate, 'days') + 1;

                // if startDate of cache and request same AND
                // endDate of cache and request same AND
                // totalStoredData match totalDaysRequested
                // it means the all the requested data actually fully cached
                if (startDateDiff === 0 && endDateDiff === 0 && storedTickerDataArr.length === totalDaysInRequest) {
                    return cacheStatusFactory(
                        tickerName,
                        CACHE_AVAILABILITY.FULL,
                        storedTickerDataArr
                    );
                }

                // at this point, it means the requested data is partially cached
                // it can be gap in beginning, end or multiple gaps in middle
                const dateGaps = [];

                // check beginning gap
                // add gap from 'fromDate' to 'firstStoredDate - 1'
                if (startDateDiff !== 0) {
                    dateGaps.push(dateGapFactory(
                        fromDate.format(isoDateFormat),
                        moment(firstStoredDate).subtract(1, 'days').format(isoDateFormat)
                    ));
                }

                // check end gap
                // add gap from 'lastStoredDate + 1' to 'toDate'
                if (endDateDiff !== 0) {
                    dateGaps.push(dateGapFactory(
                        moment(lastStoredDate).add(1, 'days').format(isoDateFormat),
                        toDate.format(isoDateFormat)
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

                // sort dateGaps
                dateGaps.sort(dateGapComparer);

                // return partial cache status
                return cacheStatusFactory(
                    tickerName,
                    CACHE_AVAILABILITY.PARTIAL,
                    storedTickerDataArr,
                    dateGaps
                );
            };

            // make getTickerData request
            getTickerData(tickerName, fromDate.format(isoDateFormat), toDate.format(isoDateFormat))
                .then(storedTickerDataArr => {
                    // wrap the ticker data
                    const cacheStatusOfStoredTickerData = wrapTickerDataInsideCacheStatus(storedTickerDataArr);
                    // then pass in the cacheStatus result
                    resolve(cacheStatusOfStoredTickerData);
                }).catch(getError => {
                    reject(getError);
                });
        });
    };

    function deleteStockIDB() {
        return new Promise((resolve, reject) => {

            // close connection first if exists
            if (_db) {
                _db.close();
            }

            const delRequest = indexedDB.deleteDatabase(config.dbName);

            delRequest.onsuccess = (event) => {
                resolve(`Successfully deleted database with name: ${config.dbName}`);
            };
            delRequest.onerror = (event) => {
                reject(`Fail to delete databse with name: ${config.dbName}, error: ${delRequest.error}`);
            };
            delRequest.onupgradeneeded = () => {
                reject(`Fail to delete databse with name: ${config.dbName} (upgradeneeded)`);
            };
            delRequest.onblocked = () => {
                reject(`Fail to delete database with name: ${config.dbName} (blocked)`);
            };

        });
    };

    _init();

    const stockIDBInstance = {
        isIndexedDBExist,
        getConfig,
        getOrCreateStockIDB,
        getStockIDB,
        getTickerObjectStoreKey,
        putTickerData,
        getTickerData,
        getCachedTickerData,
        deleteStockIDB
    };

    // using overrider/enhancer, inspired by
    // https://github.com/reactjs/redux/blob/master/src/createStore.js
    if (overrider) {
        return overrider(stockIDBInstance);
    }

    return stockIDBInstance;
};


/**
 * Implementing middleware for all functions in StockIDB
 * inspired by example of redux
 * http://redux.js.org/docs/advanced/Middleware.html
 * https://github.com/reactjs/redux/blob/master/src/applyMiddleware.js
 * 
 * @param {String} functionName
 * @param { next => requestedFunctionParam => requestedFunctionReturn } middlewares
 * @returns wrappedFunction of the functionName which chains all the middlewares
 */
function _applyFunctionMiddleware(boundObject, functionName, ...middlewares) {
    middlewares.reverse();

    let wrappedFunc = boundObject[functionName];

    middlewares.forEach(middleware => {
        wrappedFunc = middleware(wrappedFunc);
    });
    return wrappedFunc;
}

/**
 * Apply middleware to multiple functions for the stockIDB object
 * will return a copy of stockIDB object with middlewares applied to requested functions
 * 
 * @param {[{functionName: String, middlewares: [functions]}]} middleWareSelectors 
 * @returns {(boundObject) => stockIDBWithMiddleware} stockIDB with applied middlewares for some functions
 */
export function applyMiddleware(middleWareSelectors) {
    return (boundObject) => {
        if (!Array.isArray(middleWareSelectors)) {
            middleWareSelectors = [middleWareSelectors];
        }

        const overridenFunctions = {};

        middleWareSelectors.forEach(middlewareSelector => {
            if (!('functionName' in middlewareSelector) || !('middlewares' in middlewareSelector)) {
                throw new Error(`functionName and middlewares must exist in each middleware selector`);
            }

            // if the middlewares provided is not an array, convert to array
            if (!Array.isArray(middlewareSelector.middlewares)) {
                middlewareSelector.middlewares = [middlewareSelector.middlewares];
            }

            overridenFunctions[middlewareSelector.functionName] = _applyFunctionMiddleware(
                boundObject,
                middlewareSelector.functionName,
                ...middlewareSelector.middlewares
            );
        });

        return Object.assign(createStockIDB(), overridenFunctions);
    };
}
