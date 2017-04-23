import StockIDB from './stockIDB';
import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment';

describe('indexedDBCache test', () => {
    let sandbox;
    let testDb;
    let databaseCleared = false;

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

    const stockDataComparer = (a, b) => {
        return a.date < b.date ?
            -1 : (a.date > b.date ? 1 : 0);
    };

    const catchErrorAsync = (done, errorMsgPrefix = `Catch error`) =>
        (err) =>
            done(new Error(`${errorMsgPrefix}: ${err}`));

    before((done) => {
        // setup sandbox for test
        sandbox = sinon.sandbox.create();

        StockIDB.getOrCreateStockIDB()
            .then((db) => {
                testDb = db;
                databaseCleared = false;
                done();
            }).catch(catchErrorAsync(done, 'Fail to initialize testDB'));
    });

    after(() => {
        // restore all changes made in sandbox
        sandbox.restore();
        // and expect the database has been cleared in the end of the test
        // expect(databaseCleared).to.be.true;
    });

    // ------ ORDER OF THESE TESTS MATTERS ------

    it(`${StockIDB.putTickerData.name} puts data correctly and returning correct SORTED keys`, (done) => {
        const stockDataTest = [...amznData, ...msftData, ...googData];

        StockIDB.putTickerData(stockDataTest)
            .then(results => {
                // test length
                expect(results.length).to.deep.equal(stockDataTest.length);

                let expectedKeys = stockDataTest.map(StockIDB.getTickerObjectStoreKey);
                // sort expectedKeys
                expectedKeys = expectedKeys.sort();
                expect(results).to.deep.equal(expectedKeys);
                done();
            }).catch(catchErrorAsync(done, 'Put request error'));
    });

    it(`${StockIDB.getTickerData.name} returns data correctly and return SORTED data`, (done) => {
        StockIDB.getTickerData('AMZN', '20170109', '20170113')
            .then(tickerData => {
                // sort the data first
                const sortedAmznData = amznData.sort(stockDataComparer);

                expect(tickerData).to.deep.equal(amznData);
                done();
            }).catch(catchErrorAsync(done, `Get request error`));
    });

    it(`${StockIDB.getTickerData.name} returns data correctly and return SORTED data from CLONE of StockIDB`, (done) => {
        const clone = Object.assign({}, StockIDB);

        clone.getTickerData('AMZN', '20170109', '20170113')
            .then(tickerData => {
                // sort the data first
                const sortedAmznData = amznData.sort(stockDataComparer);

                expect(tickerData).to.deep.equal(amznData);
                done();
            }).catch(catchErrorAsync(done, `Get request error`));
    });

    it(`${StockIDB.getCachedTickerData.name} returns fully cached data correctly`, (done) => {
        StockIDB.getCachedTickerData('MSFT', '20170106', '20170108')
            .then(cachedTickerData => {

                const expectedTickerResult = [
                    { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
                    { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
                    { date: "20170107", ticker: 'MSFT', open: 11, close: 312 }
                ];
                // sort again since indexedDB will sort it
                expectedTickerResult.sort(stockDataComparer);

                const expectedResult = StockIDB.cacheStatusFactory(
                    StockIDB.CACHE_AVAILABILITY.FULL,
                    expectedTickerResult
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error:`));
    });

    it(`${StockIDB.getCachedTickerData.name} returns partially cached data correctly (after date gap)`, (done) => {
        StockIDB.getCachedTickerData('MSFT', '20170106', '20170110')
            .then(cachedTickerData => {
                // order matters for dategaps
                const expectedDateGaps = [
                    StockIDB.dateGapFactory('20170109', '20170110')
                ];

                const expectedResult = StockIDB.cacheStatusFactory(
                    StockIDB.CACHE_AVAILABILITY.PARTIAL,
                    msftData.sort(stockDataComparer),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${StockIDB.getCachedTickerData.name} returns partially cached data correctly (before date gap)`, (done) => {
        StockIDB.getCachedTickerData('MSFT', '20161201', '20170108')
            .then(cachedTickerData => {
                // order matters for dategaps
                const expectedDateGaps = [
                    StockIDB.dateGapFactory('20161201', '20170105')
                ];

                const expectedResult = StockIDB.cacheStatusFactory(
                    StockIDB.CACHE_AVAILABILITY.PARTIAL,
                    msftData.sort(stockDataComparer),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${StockIDB.getCachedTickerData.name} returns partially cached data correctly (before and after date gap)`, (done) => {
        StockIDB.getCachedTickerData('MSFT', '20161201', '20170115')
            .then(cachedTickerData => {
                // order matters for dategaps
                const expectedDateGaps = [
                    StockIDB.dateGapFactory('20161201', '20170105'), //before
                    StockIDB.dateGapFactory('20170109', '20170115') // after
                ];

                const expectedResult = StockIDB.cacheStatusFactory(
                    StockIDB.CACHE_AVAILABILITY.PARTIAL,
                    msftData.sort(stockDataComparer),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${StockIDB.getCachedTickerData.name} returns partially cached data correctly (1 middle date gap)`, (done) => {
        StockIDB.getCachedTickerData('GOOG', '20170101', '20170108')
            .then(cachedTickerData => {
                // order matters for dategaps
                const expectedDateGaps = [
                    StockIDB.dateGapFactory('20170104', '20170105')
                ];

                const expectedResult = StockIDB.cacheStatusFactory(
                    StockIDB.CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparer).filter(
                        data => moment(data.date).isBetween('20170101', '20170108', 'days', '[]')
                    ),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${StockIDB.getCachedTickerData.name} returns partially cached data correctly (multiple middledate gaps)`, (done) => {
        StockIDB.getCachedTickerData('GOOG', '20170101', '20170112')
            .then(cachedTickerData => {
                // order matters for dategaps
                const expectedDateGaps = [
                    StockIDB.dateGapFactory('20170104', '20170105'),
                    StockIDB.dateGapFactory('20170109', '20170109')
                ];

                const expectedResult = StockIDB.cacheStatusFactory(
                    StockIDB.CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparer),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${StockIDB.getCachedTickerData.name} returns partially cached data correctly (multiple date gaps - before and middle)`, (done) => {
        StockIDB.getCachedTickerData('GOOG', '20161201', '20170112')
            .then(cachedTickerData => {
                // order matters for dategaps
                const expectedDateGaps = [
                    StockIDB.dateGapFactory('20161201', '20161231'), // before
                    StockIDB.dateGapFactory('20170104', '20170105'), // middle gaps
                    StockIDB.dateGapFactory('20170109', '20170109')
                ];

                const expectedResult = StockIDB.cacheStatusFactory(
                    StockIDB.CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparer),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${StockIDB.getCachedTickerData.name} returns partially cached data correctly (multiple date gaps - after and middle)`, (done) => {
        StockIDB.getCachedTickerData('GOOG', '20170101', '20170312')
            .then(cachedTickerData => {
                // order matters for dategaps
                const expectedDateGaps = [
                    StockIDB.dateGapFactory('20170113', '20170312'), // after
                    StockIDB.dateGapFactory('20170104', '20170105'), // middle gaps
                    StockIDB.dateGapFactory('20170109', '20170109')
                ];

                const expectedResult = StockIDB.cacheStatusFactory(
                    StockIDB.CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparer),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`${StockIDB.getCachedTickerData.name} returns partially cached data correctly (multiple date gaps - everywhere)`, (done) => {
        StockIDB.getCachedTickerData('GOOG', '20161201', '20170312')
            .then(cachedTickerData => {
                // order matters for dategaps
                const expectedDateGaps = [
                    StockIDB.dateGapFactory('20161201', '20161231'), // before
                    StockIDB.dateGapFactory('20170113', '20170312'), // after
                    StockIDB.dateGapFactory('20170104', '20170105'), // middle gaps
                    StockIDB.dateGapFactory('20170109', '20170109')
                ];

                const expectedResult = StockIDB.cacheStatusFactory(
                    StockIDB.CACHE_AVAILABILITY.PARTIAL,
                    googData.sort(stockDataComparer),
                    expectedDateGaps
                );

                expect(cachedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, `Get cached error`));
    });

    it(`applies 1 middleware correctly`, (done) => {
        const getTickerDataMiddleware = (next) => (tickerName, fromDate, toDate) => {
            console.log('test', next);
            tickerName = 'MSFT';
            fromDate = '20150101';
            toDate = '20180101';

            return next(tickerName, fromDate, toDate);
        };

        const wrappedStockIDB = StockIDB.applyMiddleware({
            functionName: 'getTickerData',
            middlewares: getTickerDataMiddleware
        });

        console.log('wrapped', wrappedStockIDB.getTickerData);
        console.log('wrapped', wrappedStockIDB);
        const wrap2 = Object.assign({}, StockIDB);

        wrap2.getTickerData = wrappedStockIDB.getTickerData;

        wrap2.getTickerData('GOOG', '20161201', '20170312')
            .then(tickerData => {
                console.log(`middleware tickerdata`, tickerData);

                const expectedResult = [
                    { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
                    { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
                    { date: "20170107", ticker: 'MSFT', open: 11, close: 312 }
                ];

                expect(tickerData).to.deep.equal(expectedResult);
                done();
            }).catch(catchErrorAsync(done, 'Middleware getTickerData error'));

    });

    it('delete database correctly', (done) => {

        // function to check if database deleted
        const checkDatabase = StockIDB.getStockIDB()
            .then(db => {
                done(`database is not deleted successfully!`);
            }).catch(error => {
                // check if the error is from indexedDB itself
                if (error.prototype instanceof Error) {
                    done(`indexedDB error: ${error}`);
                } else {
                    // database deleted successfully
                    databaseCleared = true;
                    done();
                }
            });

        // delete database
        StockIDB.deleteStockIDB()
            .then(msg => {
                checkDatabase(done);
            }).catch(catchErrorAsync(done, 'delete database error'));

    });
});