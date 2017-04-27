import createQuandlIDB from './quandlIDB';
import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment';

describe('quandlIDB test', () => {
    const quandlIDB = createQuandlIDB();
    let sandbox;

    const catchErrorAsync = (done, errorMsgPrefix = `Catch error`) => (err) =>
        done(new Error(`${errorMsgPrefix}: ${err}`));

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
            .catch(catchErrorAsync(done, 'Fail to initialize testDB'));;

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

    it(`${quandlIDB.put} put stockData without dategap`, done => {
        const startDate = '20170101';
        const endDate = '20170131';

        quandlIDB.putTickerData(googData, startDate, endDate)
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
                        ticker: 'GOOG'
                    });
                });

                expect(results.length).to.equal(expectedDateRange.length);
                expect(results).to.deep.equal(expectedResults);
                done();
            });
    });

});