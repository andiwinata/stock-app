import createQuandlIDB from './quandlIDB';
import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment';

describe('quandlIDB test', () => {
    const quandlIDB = createQuandlIDB();
    let sandbox;

    const catchErrorAsync = (done, errorMsgPrefix = `Catch error`) => (err) =>
        done(new Error(`${errorMsgPrefix}: ${err}`));

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

        done();
    });

});