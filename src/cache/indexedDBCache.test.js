import QuandlIndexedDBCache from './indexedDBCache';
import { expect } from 'chai';
import sinon from 'sinon';

describe('indexedDBCache test', () => {
    let sandbox;
    const testDb = "I'm test db";

    before(() => {
        // setup sandbox for test
        sandbox = sinon.sandbox.create();
        sandbox.stub(QuandlIndexedDBCache, 'getOrCreateQuandlIndexedDB').returns(testDb);
    });

    after(() => {
        // restore all changes made in sandbox
        sandbox.restore();
    });

    it('returns sinon stub correctly', () => {
        expect(QuandlIndexedDBCache.getOrCreateQuandlIndexedDB()).to.deep.equal(testDb);
    });
});