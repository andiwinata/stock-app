import QuandlIndexedDBCache from './indexedDBCache';
import { expect } from 'chai';
import sinon from 'sinon';

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

    const stockDataComparer = (a, b) => {
        return a.date < b.date ?
            -1 : (a.date > b.date ? 1 : 0);
    };

    before((done) => {
        // setup sandbox for test
        sandbox = sinon.sandbox.create();

        QuandlIndexedDBCache.getOrCreateQuandlIndexedDB()
            .then((db) => {
                testDb = db;
                databaseCleared = false;
                done();
            }).catch(err => {
                done(new Error(`fail to initialize testDB: ${err}`));
            });
    });

    after(() => {
        // restore all changes made in sandbox
        sandbox.restore();
        // and expect the database has been cleared in the end of the test
        // expect(databaseCleared).to.be.true;
    });

    // ------ ORDER OF THESE TESTS MATTERS ------ TODO!!!!!

    it('put data correctly and returning correct SORTED keys', (done) => {
        const stockDataTest = [...amznData, ...msftData];

        QuandlIndexedDBCache.putTickerData(stockDataTest)
            .then(results => {
                // test length
                expect(results.length).to.deep.equal(stockDataTest.length);

                let expectedKeys = stockDataTest.map(QuandlIndexedDBCache.getTickerObjectStoreKey);
                // sort expectedKeys
                expectedKeys = expectedKeys.sort(stockDataComparer);

                expect(results).to.deep.equal(expectedKeys);
                done();
            }).catch(putError => {
                done(new Error(`Put request error: ${putError}`));
            });
    });

    it('get data correctly and return SORTED data', (done) => {
        QuandlIndexedDBCache.getTickerData('AMZN', '20170109', '20170113')
            .then(tickerData => {
                // sort the data first
                const sortedAmznData = amznData.sort(stockDataComparer);

                expect(tickerData).to.deep.equal(amznData);
                done();
            }).catch(getError => {
                done(new Error(`Get request error: ${getError}`));
            });
    });

    it(`${QuandlIndexedDBCache.getCachedTickerData.name} returns fully cached data correctly`, (done) => {
        QuandlIndexedDBCache.getCachedTickerData('MSFT', '20170106', '20170108')
            .then(storedTickerData => {

                const expectedTickerResult = [
                    { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
                    { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
                    { date: "20170107", ticker: 'MSFT', open: 11, close: 312 }
                ];
                // sort again since indexedDB will sort it
                expectedTickerResult.sort(stockDataComparer);

                const expectedResult = QuandlIndexedDBCache.cacheStatusFactory(
                    QuandlIndexedDBCache.CACHE_AVAILABILITY.FULL,
                    expectedTickerResult
                );

                expect(storedTickerData).to.deep.equal(expectedResult);
                done();
            }).catch(getCachedError => {
                done(new Error(`Get cached error: ${getCachedError}`));
            });
    });

    it('delete database correctly', (done) => {

        // function to check if database deleted
        const checkDatabase = QuandlIndexedDBCache.getQuandlIndexedDB()
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
        QuandlIndexedDBCache.deleteQuandlIndexedDB()
            .then(msg => {
                checkDatabase(done);
            }).catch(err => {
                done(`delete database error`, err);
            });

    });
});