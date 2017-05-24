import createQuandlIDB, { CACHE_AVAILABILITY, dateGapFactory, cacheStatusFactory } from './quandlIDB';
import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import { stockDataComparerDate } from './stockIDB';

describe('quandlIDB test', () => {
    const quandlIDB = createQuandlIDB();
    let sandbox;

    const catchErrorAsync = (done, errorMsgPrefix = `Catch error`) => (err) => {
        const errorStr = `${errorMsgPrefix}: ${err}`;
        done(new Error(errorStr));
        return Promise.reject(errorStr);
    };

    const googData = [
        { date: "20170104", ticker: 'GOOG', open: 50, close: 100 },
        { date: "20170105", ticker: 'GOOG', open: 75, close: 551 },
        { date: "20170106", ticker: 'GOOG', open: 11, close: 312 },

        { date: "20170108", ticker: 'GOOG', open: 11, close: 313 },
        { date: "20170109", ticker: 'GOOG', open: 12, close: 314 },
        { date: "20170110", ticker: 'GOOG', open: 13, close: 315 },

        { date: "20170115", ticker: 'GOOG', open: 14, close: 316 },
        { date: "20170116", ticker: 'GOOG', open: 15, close: 317 },
        { date: "20170117", ticker: 'GOOG', open: 16, close: 318 },
    ];

    const msftData = [
        { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
        { date: "20170107", ticker: 'MSFT', open: 11, close: 312 },
        { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },

        { date: "20170115", ticker: 'MSFT', open: 76, close: 242 },
        { date: "20170116", ticker: 'MSFT', open: 77, close: 24 },
        { date: "20170117", ticker: 'MSFT', open: 87, close: 75 },
    ];

    const aanData = [
        { "date": "20170426", "ticker": "AAN", "adj_open": 31.61, "adj_high": 32.27, "adj_low": 31.58, "adj_close": 32.02, "adj_volume": 598155 },
        { "date": "20170427", "ticker": "AAN", "adj_open": 31.97, "adj_high": 32.18, "adj_low": 31.545, "adj_close": 32.11, "adj_volume": 813735 },
        { "date": "20170428", "ticker": "AAN", "adj_open": 34, "adj_high": 36.08, "adj_low": 33.86, "adj_close": 35.94, "adj_volume": 3543328 },
        { "date": "20170501", "ticker": "AAN", "adj_open": 36.4, "adj_high": 37.27, "adj_low": 36.11, "adj_close": 36.74, "adj_volume": 1657136 },
        { "date": "20170502", "ticker": "AAN", "adj_open": 36.46, "adj_high": 37.54, "adj_low": 36.13, "adj_close": 37.15, "adj_volume": 1475064 },
        { "date": "20170503", "ticker": "AAN", "adj_open": 37.06, "adj_high": 37.67, "adj_low": 36.87, "adj_close": 37.31, "adj_volume": 732554 },
        { "date": "20170504", "ticker": "AAN", "adj_open": 37.37, "adj_high": 37.455, "adj_low": 36.32, "adj_close": 36.38, "adj_volume": 936701 },
        { "date": "20170505", "ticker": "AAN", "adj_open": 36.48, "adj_high": 36.52, "adj_low": 36.04, "adj_close": 36.39, "adj_volume": 746598 },
        { "date": "20170508", "ticker": "AAN", "adj_open": 36.52, "adj_high": 36.84, "adj_low": 36, "adj_close": 36.1, "adj_volume": 529877 },
        { "date": "20170509", "ticker": "AAN", "adj_open": 36.11, "adj_high": 36.46, "adj_low": 35.96, "adj_close": 36.19, "adj_volume": 427615 },
        { "date": "20170510", "ticker": "AAN", "adj_open": 36.18, "adj_high": 36.41, "adj_low": 35.73, "adj_close": 36.25, "adj_volume": 612007 },
        { "date": "20170511", "ticker": "AAN", "adj_open": 35.94, "adj_high": 36.13, "adj_low": 35.16, "adj_close": 35.18, "adj_volume": 963541 },
        { "date": "20170512", "ticker": "AAN", "adj_open": 35, "adj_high": 35.24, "adj_low": 34.68, "adj_close": 35, "adj_volume": 503395 },
        { "date": "20170515", "ticker": "AAN", "adj_open": 35, "adj_high": 35.36, "adj_low": 34.71, "adj_close": 34.85, "adj_volume": 373348 },
        { "date": "20170516", "ticker": "AAN", "adj_open": 34.77, "adj_high": 35.17, "adj_low": 34.3, "adj_close": 35.03, "adj_volume": 594703 }
    ];

    const mixedData = [
        { date: "20170106", ticker: 'IVV', open: 50, close: 100 },

        { date: "20170107", ticker: 'SPY', open: 11, close: 312 },
        { date: "20170108", ticker: 'IVV', open: 75, close: 551 },
        { date: "20170107", ticker: 'MMM', open: 11, close: 312 },
        { date: "20170108", ticker: 'ACN', open: 75, close: 551 },

        { date: "20170115", ticker: 'SPY', open: 76, close: 242 },
        { date: "20170115", ticker: 'MMM', open: 76, close: 242 },
        { date: "20170116", ticker: 'IVV', open: 77, close: 24 },
        { date: "20170117", ticker: 'ACN', open: 87, close: 75 },
    ];

    const checkStockIDBDoesNotExist = (done) => {
        return quandlIDB.getStockIDB()
            .then(db => {
                done(`database is not deleted successfully!`);
            }).catch(error => {
                // check if the error is from indexedDB itself
                if (error.prototype instanceof Error) {
                    done(`indexedDB error: ${error}`);
                } else {
                    // database deleted successfully
                    console.log('check result: stockIDB does not exist!');
                }
            });
    }

    before((done) => {
        // make sure there is no other same IDB
        checkStockIDBDoesNotExist(done)
            .then(() => {
                // setup sandbox for test
                sandbox = sinon.sandbox.create();
                // create database
                return quandlIDB.getOrCreateStockIDB();
            })
            .then((db) => {
                done();
            })
            .catch(catchErrorAsync(done, 'Fail to initialize testDB'));

    });

    after((done) => {
        // delete idb after
        quandlIDB.deleteStockIDB()
            .catch(catchErrorAsync(done, 'delete database error'))
            // expect the database has been cleared in the end of the test
            .then(() => checkStockIDBDoesNotExist(done))
            .then(() => {
                // restore all changes made in sandbox
                sandbox.restore();
                done();
            });
    });

    const testPutTickerData = (done, tickerName, stockData, startDate, endDate) => {
        quandlIDB.putTickerData(stockData, startDate, endDate)
            .then(results => {

                // generate expected date range
                const expectedDateRange = [];
                let currDate = moment(startDate);

                while (currDate.diff(endDate, 'days') < 1) {
                    expectedDateRange.push(currDate.format('YYYYMMDD'));
                    currDate = currDate.add(1, 'days');
                }

                // get expected key results
                const expectedResults = expectedDateRange.map((date) => {
                    return quandlIDB.getTickerObjectStoreKey({
                        date,
                        ticker: tickerName
                    });
                });

                expect(results.length).to.equal(expectedDateRange.length);
                expect(results).to.deep.equal(expectedResults);
                done();
            })
            .catch(catchErrorAsync(done, `Fail in quandlIDB.putTickerData`));
    };

    it(`quandlIDB.putTickerData put stockData by filling empty date with empty data 1`, done => {
        const startDate = '20170101';
        const endDate = '20170131';

        testPutTickerData(done, 'GOOG', googData, startDate, endDate);
    });

    it(`quandlIDB.putTickerData put stockData by filling empty date with empty data 2 ignoring time`, done => {
        const startDate = '2017-04-26T23:52:18.954';
        const endDate = '2017-05-17T00:12:18.954';

        testPutTickerData(done, 'AAN', aanData, startDate, endDate);
    });

    it(`quandlIDB.putTickerData put stockData by multiple tickername`, done => {
        const startDate = '20170101';
        const endDate = '20170131';
        const stockData = mixedData.slice(0);

        quandlIDB.putTickerData(stockData, startDate, endDate)
            .then(results => {

                // generate expected date range
                const expectedDateRange = [];
                let currDate = moment(startDate);

                while (currDate.diff(endDate, 'days') < 1) {
                    expectedDateRange.push(currDate.format('YYYYMMDD'));
                    currDate = currDate.add(1, 'days');
                }

                // get expected key results
                const expectedResults = [].concat(...expectedDateRange.map((date) =>
                    [
                        quandlIDB.getTickerObjectStoreKey({ date, ticker: 'ACN' }),
                        quandlIDB.getTickerObjectStoreKey({ date, ticker: 'IVV' }),
                        quandlIDB.getTickerObjectStoreKey({ date, ticker: 'MMM' }),
                        quandlIDB.getTickerObjectStoreKey({ date, ticker: 'SPY' }),
                    ]
                )).sort();

                expect(results.length).to.equal(expectedResults.length);
                expect(results).to.deep.equal(expectedResults);
                done();
            })
            .catch(catchErrorAsync(done, `Fail in quandlIDB.putTickerData`));
    });

    it(`quandlIDB.getCachedTickerData return all NOT-empty ticker data`, done => {
        quandlIDB.getCachedTickerData('GOOG', '20170101', '20170131')
            .then(cachedTickerData => {
                const expectedResults = cacheStatusFactory(
                    'GOOG',
                    CACHE_AVAILABILITY.FULL,
                    googData.sort(stockDataComparerDate)
                );

                expect(cachedTickerData).to.deep.equal(expectedResults);
                done();
            })
            .catch(catchErrorAsync(done, `Fail in quandlIDB.getCachedTickerData`));
    });

    it(`quandlIDB.getCachedTickerData and quandlIDB.putTickerData works properly`, done => {
        const startDate = '20170103';
        const endDate = '20170131';

        const startDate2 = '20170106';
        const endDate2 = '20170115';

        quandlIDB.putTickerData(msftData, startDate, endDate)
            // test put middleware
            .then(results => {

                // generate expected date range
                const expectedDateRange = [];
                let currDate = moment(startDate);

                while (currDate.diff(endDate, 'days') < 1) {
                    expectedDateRange.push(currDate.format('YYYYMMDD'));
                    currDate = currDate.add(1, 'days');
                }

                // get expected key results
                const expectedResults = expectedDateRange.map((date) => {
                    return quandlIDB.getTickerObjectStoreKey({
                        date,
                        ticker: 'MSFT'
                    });
                });

                expect(results.length).to.equal(expectedDateRange.length);
                expect(results).to.deep.equal(expectedResults);
            })
            .catch(catchErrorAsync(done, `Fail in quandlIDB.putTickerData`))
            // test get middleware
            .then(() => {
                return quandlIDB.getCachedTickerData('MSFT', startDate2, endDate2);
            })
            .then(cachedTickerData => {
                const filteredMsftData = msftData.filter(msftData => {
                    return moment(msftData.date).isBetween(startDate2, endDate2, 'days', '[]');
                });

                const expectedResults = cacheStatusFactory(
                    'MSFT',
                    CACHE_AVAILABILITY.FULL,
                    filteredMsftData.sort(stockDataComparerDate)
                );

                expect(cachedTickerData).to.deep.equal(expectedResults);
                done();
            })
            .catch(catchErrorAsync(done, `Fail in quandlIDB.getCachedTickerData`));
    });
});