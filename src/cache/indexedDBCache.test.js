import QuandlIndexedDBCache from './indexedDBCache';
import { expect } from 'chai';
import sinon from 'sinon';

describe('indexedDBCache test', () => {
    let sandbox;
    let testDb;

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

        testDb = QuandlIndexedDBCache.getOrCreateQuandlIndexedDB()
            .then((db) => {
                testDb = db;
                console.log('finish initializing test db', testDb);
                done();
            }).catch(err => {
                console.error('fail to initialize testDB', err);
                done(`fail to initialize testDB: ${err}`);
            });
    });

    after(() => {
        // restore all changes made in sandbox
        sandbox.restore();

        // delete database
        QuandlIndexedDBCache.deleteQuandlIndexedDB();

        it('delete database correctly', (done) => {
            QuandlIndexedDBCache.getQuandlIndexedDB()
                .then(db => {
                    done(`database is not deleted successfully!`);
                }).catch(error => {
                    // check if the error is from indexedDB itself
                    if (error.prototype instanceof Error) {
                        done(`indexedDB error: ${error}`);
                    } else {
                        // database deleted successfully
                        done();
                    }
                });
        });
    });

    // ------ ORDER OF THESE TESTS MATTERS ------

    it('put data correctly and returning correct SORTED keys', (done) => {
        const stockDataTest = [...amznData, ...msftData];

        QuandlIndexedDBCache.putTickerData(stockDataTest)
            .then(results => {
                // test length
                expect(results.length).to.deep.equal(stockDataTest.length);

                let expectedKeys = stockDataTest.map(QuandlIndexedDBCache.getTickerObjectStoreKey);
                // sort expectedKeys
                expectedKeys = expectedKeys.sort(stockDataComparer);

                console.log('results', results, 'expectedkeys', expectedKeys, 'test', stockDataTest);
                expect(results).to.deep.equal(expectedKeys);
                done();
            }).catch(putError => {
                done(`Put request error: ${putError}`);
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
                done(`Get request error: ${getError}`);
            });
    });
});