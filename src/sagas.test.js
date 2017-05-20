import { stockDataComparer } from './cache/quandlIDB';

import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment';

import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import {
    getApiKey, getServerHost, getSelectedDate, getSelectedTickers, getStoredStockData,
    selectedDataChanged
} from './sagas';

describe('SAGA selectedDataChanged test', () => {

    const dateRange = {
        startDate: 20170501,
        endDate: 20170519
    };

    const selectedTickersObj = [
        { key: 'MSFT', value: 'MSFT' },
        { key: 'AMZN', value: 'AMZN' }
    ];

    const serverHost = '';
    const apiKey = '';

    before(done => {
        done();
    });

    const getVariablesTest = (gen) => {
        expect(gen.next().value).to.equal(select(getSelectedDate));
        expect(gen.next(dateRange).value).to.equal(select(getSelectedTickers));
        expect(gen.next(selectedTickersObj).value).to.equal(select(getServerHost));

    };

    it('works properly with fully cached ticker request', (done) => {
        const gen = selectedDataChanged();
        done();
    });

});