import createStockIDB, {
    applyMiddleware, stockDataComparerDate, dateGapComparer,
    CACHE_AVAILABILITY, dateGapFactory, cacheStatusFactory
} from './stockIDB';
import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import { adbeData } from '../../test/testData';

describe('stockIDB test', () => {
    const stockIDB = createStockIDB();
    let sandbox;

    const amznData = [
        { date: "20170109", ticker: 'AMZN', open: 25, close: 9999 },
        { date: "20170113", ticker: 'AMZN', open: 42, close: 12 },
        { date: "20170112", ticker: 'AMZN', open: 35, close: 456 },
    ];

    const msftData = [
        { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
        { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
        { date: "20170107", ticker: 'MSFT', open: 11, close: 312 },
    ];

    const googData = [
        { date: "20170101", ticker: 'GOOG', open: 50, close: 100 },
        { date: "20170102", ticker: 'GOOG', open: 75, close: 551 },
        { date: "20170103", ticker: 'GOOG', open: 11, close: 312 },

        { date: "20170106", ticker: 'GOOG', open: 11, close: 313 },
        { date: "20170107", ticker: 'GOOG', open: 12, close: 314 },
        { date: "20170108", ticker: 'GOOG', open: 13, close: 315 },

        { date: "20170110", ticker: 'GOOG', open: 14, close: 316 },
        { date: "20170111", ticker: 'GOOG', open: 15, close: 317 },
        { date: "20170112", ticker: 'GOOG', open: 16, close: 318 },
    ];

    const catchErrorAsync = (done, errorMsgPrefix = `Catch error`) => (err) => {
        const errorStr = `${errorMsgPrefix}: ${err}`;
        done(new Error(errorStr));
        return Promise.reject(errorStr);
    };

    const testStockIDBDoesNotExist = (done) => {
        return stockIDB.getStockIDB()
            .then(db => {
                done(`database is not deleted successfully!`);
            }).catch(error => {
                // check if the error is from indexedDB itself
                if (error.prototype instanceof Error) {
                    done(`indexedDB error: ${error}`);
                } else {
                    // database deleted successfully
                }
            });
    }

    before((done) => {
        // make sure there is no other same IDB
        testStockIDBDoesNotExist(done)
            .then(() => {
                // setup sandbox for test
                sandbox = sinon.sandbox.create();
                // create database
                return stockIDB.getOrCreateStockIDB();
            })
            .then((db) => {
                done();
            })
            .catch(catchErrorAsync(done, 'Fail to initialize testDB'));
    });

    after((done) => {
        // delete idb after
        stockIDB.deleteStockIDB()
            .catch(catchErrorAsync(done, 'delete database error'))
            // expect the database has been cleared in the end of the test
            .then(() => testStockIDBDoesNotExist(done))
            .then(() => {
                // restore all changes made in sandbox
                sandbox.restore();
                done();
            });
    });

    // ------ ORDER OF THESE TESTS MATTERS ------
    // because of put(), the order of get() does not really matter
    // not sure if this is the correct approach, this causes unit test dependant to others
    // They also share same instance of indexedDB, so all put will be retained until deleted

    const testPutTickerData = (done, stockData) => {
        stockIDB.putTickerData(stockData)
            .then(results => {
                // test length
                expect(results.length).to.deep.equal(stockData.length);

                let expectedKeys = stockData.map(stockIDB.getTickerObjectStoreKey);
                // sort expectedKeys
                expectedKeys = expectedKeys.sort();
                expect(results).to.deep.equal(expectedKeys);
                done();
            }).catch(catchErrorAsync(done, 'Put request error'));
    };

    it(`${stockIDB.putTickerData.name} puts data correctly and returning correct SORTED keys`, (done) => {
        testPutTickerData(done, [...amznData, ...msftData]);
    });

    it(`${stockIDB.putTickerData.name} puts data correctly and returning correct SORTED keys for the second time`, (done) => {
        testPutTickerData(done, [...googData, ...adbeData]);
    });

    it(`${stockIDB.getTickerData.name} returns data correctly and return SORTED data`, (done) => {
        stockIDB.getTickerData('AMZN', '20170109', '20170113')
            .then(tickerData => {
                // sort the data first
                const sortedAmznData = amznData.sort(stockDataComparerDate);

                expect(tickerData).to.deep.equal(amznData);
                done();
            }).catch(catchErrorAsync(done, `Get request error`));
    });

    it(`${stockIDB.getTickerData.name} returns data correctly and return SORTED data from CLONE of StockIDB`, (done) => {
        const clone = Object.assign({}, stockIDB);

        clone.getTickerData('AMZN', '20170109', '20170113')
            .then(tickerData => {
                // sort the data first
                const sortedAmznData = amznData.sort(stockDataComparerDate);

                expect(tickerData).to.deep.equal(amznData);
                done();
            }).catch(catchErrorAsync(done, `Get request error`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns non cached data correctly`, (done) => {
        stockIDB.getCachedTickerData('NULL', '20170106', '20170108')
            .then(cachedTickerData => {
                const expectedResult = cacheStatusFactory(
                    'NULL',
                    CACHE_AVAILABILITY.NONE,
                    [],
                    [dateGapFactory('20170106', '20170108')]
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error:`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns fully cached data correctly`, (done) => {
        stockIDB.getCachedTickerData('MSFT', '20170106', '20170108')
            .then(cachedTickerData => {

                const expectedTickerResult = [
                    { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
                    { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
                    { date: "20170107", ticker: 'MSFT', open: 11, close: 312 }
                ];
                // sort again since indexedDB will sort it
                expectedTickerResult.sort(stockDataComparerDate);

                const expectedResult = cacheStatusFactory(
                    'MSFT',
                    CACHE_AVAILABILITY.FULL,
                    expectedTickerResult
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error:`));
    });

     it(`${stockIDB.getCachedTickerData.name} returns fully cached data correctly for long duration data`, (done) => {
        stockIDB.getCachedTickerData('ADBE', '20170228', '20170529')
            .then(cachedTickerData => {

                const expectedTickerResult = [...adbeData];
                // sort again since indexedDB will sort it
                expectedTickerResult.sort(stockDataComparerDate);

                const expectedResult = cacheStatusFactory(
                    'ADBE',
                    CACHE_AVAILABILITY.FULL,
                    expectedTickerResult
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error:`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns partially cached data correctly (after date gap)`, (done) => {
        stockIDB.getCachedTickerData('MSFT', '20170106', '20170110')
            .then(cachedTickerData => {
                const expectedDateGaps = [
                    dateGapFactory('20170109', '20170110')
                ].sort(dateGapComparer);

                const expectedResult = cacheStatusFactory(
                    'MSFT',
                    CACHE_AVAILABILITY.PARTIAL,
                    msftData.sort(stockDataComparerDate),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns partially cached data correctly (before date gap)`, (done) => {
        stockIDB.getCachedTickerData('MSFT', '20161201', '20170108')
            .then(cachedTickerData => {
                const expectedDateGaps = [
                    dateGapFactory('20161201', '20170105')
                ].sort(dateGapComparer);

                const expectedResult = cacheStatusFactory(
                    'MSFT',
                    CACHE_AVAILABILITY.PARTIAL,
                    msftData.sort(stockDataComparerDate),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns partially cached data correctly (before and after date gap)`, (done) => {
        stockIDB.getCachedTickerData('MSFT', '20161201', '20170115')
            .then(cachedTickerData => {
                const expectedDateGaps = [
                    dateGapFactory('20161201', '20170105'), //before
                    dateGapFactory('20170109', '20170115') // after
                ].sort(dateGapComparer);

                const expectedResult = cacheStatusFactory(
                    'MSFT',
                    CACHE_AVAILABILITY.PARTIAL,
                    msftData.sort(stockDataComparerDate),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns partially cached data correctly (1 middle date gap)`, (done) => {
        stockIDB.getCachedTickerData('GOOG', '20170101', '20170108')
            .then(cachedTickerData => {
                const expectedDateGaps = [
                    dateGapFactory('20170104', '20170105')
                ];

                const expectedResult = cacheStatusFactory(
                    'GOOG',
                    CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparerDate).filter(
                        data => moment(data.date).isBetween('20170101', '20170108', 'days', '[]')
                    ),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns partially cached data correctly (multiple middledate gaps)`, (done) => {
        stockIDB.getCachedTickerData('GOOG', '20170101', '20170112')
            .then(cachedTickerData => {
                const expectedDateGaps = [
                    dateGapFactory('20170104', '20170105'),
                    dateGapFactory('20170109', '20170109')
                ].sort(dateGapComparer);

                const expectedResult = cacheStatusFactory(
                    'GOOG',
                    CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparerDate),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns partially cached data correctly (multiple date gaps - before and middle)`, (done) => {
        stockIDB.getCachedTickerData('GOOG', '20161201', '20170112')
            .then(cachedTickerData => {
                const expectedDateGaps = [
                    dateGapFactory('20161201', '20161231'), // before
                    dateGapFactory('20170104', '20170105'), // middle gaps
                    dateGapFactory('20170109', '20170109')
                ].sort(dateGapComparer);

                const expectedResult = cacheStatusFactory(
                    'GOOG',
                    CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparerDate),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns partially cached data correctly (multiple date gaps - after and middle)`, (done) => {
        stockIDB.getCachedTickerData('GOOG', '20170101', '20170312')
            .then(cachedTickerData => {
                const expectedDateGaps = [
                    dateGapFactory('20170113', '20170312'), // after
                    dateGapFactory('20170104', '20170105'), // middle gaps
                    dateGapFactory('20170109', '20170109')
                ].sort(dateGapComparer);

                const expectedResult = cacheStatusFactory(
                    'GOOG',
                    CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparerDate),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${stockIDB.getCachedTickerData.name} returns partially cached data correctly (multiple date gaps - everywhere)`, (done) => {
        stockIDB.getCachedTickerData('GOOG', '20161201', '20170312')
            .then(cachedTickerData => {
                const expectedDateGaps = [
                    dateGapFactory('20161201', '20161231'), // before
                    dateGapFactory('20170113', '20170312'), // after
                    dateGapFactory('20170104', '20170105'), // middle gaps
                    dateGapFactory('20170109', '20170109')
                ].sort(dateGapComparer);

                const expectedResult = cacheStatusFactory(
                    'GOOG',
                    CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparerDate),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`applies 1 middleware correctly for 1 function`, (done) => {
        const getTickerDataMiddleware = (next) => (tickerName, fromDate, toDate, lol) => {
            tickerName = 'MSFT';
            fromDate = '20150101';
            toDate = '20180101';

            return next(tickerName, fromDate, toDate);
        };

        const overrider = applyMiddleware({
            functionName: 'getTickerData',
            middlewares: getTickerDataMiddleware
        });

        const wrappedStockIDB = createStockIDB(overrider);

        wrappedStockIDB.getTickerData('GOOG', '20161201', '20170312')
            .then(tickerData => {
                const expectedResult = [
                    { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
                    { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
                    { date: "20170107", ticker: 'MSFT', open: 11, close: 312 },
                ];

                expect(tickerData).to.deep.equal(expectedResult.sort(stockDataComparerDate));
                done();
            }).catch(catchErrorAsync(done, 'Middleware getTickerData error'));
    });

    it(`applies multiple middlewares correctly for 1 function`, (done) => {
        const getTickerDataMiddleware1 = (next) => (tickerName, fromDate, toDate, lol) => {
            tickerName = 'GOOG';
            return next(tickerName, fromDate, toDate);
        };

        const getTickerDataMiddleware2 = (next) => (tickerName, fromDate, toDate, lol) => {
            fromDate = '20170107';
            return next(tickerName, fromDate, toDate);
        };

        const getTickerDataMiddleware3 = (next) => (tickerName, fromDate, toDate, lol) => {
            toDate = '20170112';
            return next(tickerName, fromDate, toDate);
        };

        const overrider = applyMiddleware({
            functionName: 'getTickerData',
            middlewares: [getTickerDataMiddleware1, getTickerDataMiddleware2, getTickerDataMiddleware3]
        });

        const wrappedStockIDB = createStockIDB(overrider);

        wrappedStockIDB.getTickerData('MSFT', '20170102', '20170108')
            .then(tickerData => {
                const expectedResult = [
                    { date: "20170107", ticker: 'GOOG', open: 12, close: 314 },
                    { date: "20170108", ticker: 'GOOG', open: 13, close: 315 },
                    { date: "20170110", ticker: 'GOOG', open: 14, close: 316 },
                    { date: "20170111", ticker: 'GOOG', open: 15, close: 317 },
                    { date: "20170112", ticker: 'GOOG', open: 16, close: 318 },
                ];

                expect(tickerData).to.deep.equal(expectedResult.sort(stockDataComparerDate));
                done();
            }).catch(catchErrorAsync(done, 'Middleware getTickerData error'));
    });

    it(`applies multiple middlewares correctly for multiple functions`, (done) => {
        const putMiddlewareData = [
            { date: "20170101", ticker: 'INVALID', open: -1, close: -1 },
            { date: "20170102", ticker: 'INVALID', open: -1, close: -1 },
            { date: "20170103", ticker: 'INVALID', open: -1, close: -1 },
        ];

        const toBeOverridenTestData = [
            { date: "20170105", ticker: 'TEST', open: 12, close: 314 },
            { date: "20170106", ticker: 'TEST', open: 13, close: 123 },
            { date: "20170107", ticker: 'TEST', open: 14, close: 234 },
            { date: "20170108", ticker: 'TEST', open: 14, close: 234 },
            { date: "20170109", ticker: 'TEST', open: 14, close: 234 },
        ];

        const getTickerDataMiddleware1 = (next) => (tickerName, fromDate, toDate, lol) => {
            tickerName = 'INVALID';
            return next(tickerName, fromDate, toDate);
        };

        const getTickerDataMiddleware2 = (next) => (tickerName, fromDate, toDate, lol) => {
            fromDate = '20170101';
            return next(tickerName, fromDate, toDate);
        };

        const getTickerDataMiddleware3 = (next) => (tickerName, fromDate, toDate, lol) => {
            toDate = '20170103';
            return next(tickerName, fromDate, toDate);
        };

        const putTickerDataMiddleware1 = (next) => (tickerData) => {
            // replace tickerData
            tickerData = putMiddlewareData;
            return next(tickerData);
        };

        const overrider = applyMiddleware([
            {
                functionName: 'getTickerData',
                middlewares: [getTickerDataMiddleware1, getTickerDataMiddleware2, getTickerDataMiddleware3]
            },
            {
                functionName: 'putTickerData',
                middlewares: putTickerDataMiddleware1
            }
        ]);

        const wrappedStockIDB = createStockIDB(overrider);

        const testPutMiddleware = results => {
            // test length
            expect(results.length).to.deep.equal(putMiddlewareData.length);

            let expectedKeys = putMiddlewareData.map(stockIDB.getTickerObjectStoreKey);
            // sort expectedKeys
            expectedKeys = expectedKeys.sort();
            expect(results).to.deep.equal(expectedKeys);
        };

        const testGetMiddleware = tickerData => {
            expect(tickerData).to.deep.equal(putMiddlewareData.sort(stockDataComparerDate));
            done();
        };

        wrappedStockIDB.putTickerData(toBeOverridenTestData)
            .then(testPutMiddleware, catchErrorAsync(done, 'Put request error'))
            .then(() => {
                return wrappedStockIDB.getTickerData('INVALID', '20160101', '20180101');
            })
            .then(testGetMiddleware, catchErrorAsync(done, 'Get request error'))
            .catch(catchErrorAsync(done, 'Unexpected error using put and get'));
    });

    it(`stockIDB works properly when using different format of ISO date format`, (done) => {
        const testData = [
            { date: "2017-01-03", ticker: 'TEST_DIFFERENT_ISO_FORMAT', open: 10, close: 10 },
            { date: "2017-01-06", ticker: 'TEST_DIFFERENT_ISO_FORMAT', open: 11, close: 11 },
            { date: "2017-01-07", ticker: 'TEST_DIFFERENT_ISO_FORMAT', open: 12, close: 12 }
        ];

        const formattedTestData = testData.map(data => {
            const dataCopy = Object.assign({}, data);
            dataCopy.date = moment(dataCopy.date, 'YYYY-MM-DD').format('YYYYMMDD');
            return dataCopy;
        });

        stockIDB.putTickerData(testData)
            .then(results => {
                expect(results.length).to.deep.equal(formattedTestData.length);

                let expectedKeys = formattedTestData.map(stockIDB.getTickerObjectStoreKey);
                // sort expectedKeys
                expectedKeys = expectedKeys.sort();
                expect(results).to.deep.equal(expectedKeys);
            }, catchErrorAsync(done, 'Put error'))
            .then(() => {
                return stockIDB.getCachedTickerData('TEST_DIFFERENT_ISO_FORMAT', '2017-01-01', '2017-01-31');
            })
            .then(cachedTickerData => {
                const expectedDateGaps = [
                    dateGapFactory('20170101', '20170102'),
                    dateGapFactory('20170104', '20170105'),
                    dateGapFactory('20170108', '20170131')
                ].sort(dateGapComparer);

                const expectedResult = cacheStatusFactory(
                    'TEST_DIFFERENT_ISO_FORMAT',
                    CACHE_AVAILABILITY.PARTIAL,
                    formattedTestData.sort(stockDataComparerDate),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }, catchErrorAsync(done, `Get cached error`))
            .catch(catchErrorAsync(done, `Unknown error in put and get`));
    });

});