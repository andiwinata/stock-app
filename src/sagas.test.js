import { stockDataComparer, CACHE_AVAILABILITY, cacheStatusFactory, dateGapFactory } from './cache/quandlIDB';
import { quandlIDB } from './cache/quandlIDBInstance';

import * as actionCreators from './actionCreators';

import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment';

import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import {
    getApiKey, getServerHost, getSelectedDate,
    getSelectedTickers, getStoredStockData, convertCacheStatusesToActionTickerData,
    selectedDataChanged
} from './sagas';

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

describe('convertCacheStatusesToActionTickerData test', () => {

    const cacheStatus1 = cacheStatusFactory('MSFT', CACHE_AVAILABILITY.FULL, msftData, []);
    const cacheStatus2 = cacheStatusFactory('AMZN', CACHE_AVAILABILITY.FULL, amznData, []);

    const cacheStatus1Overlap = cacheStatusFactory('MSFT', CACHE_AVAILABILITY.NONEL, [], []);

    it('works correctly with 1 cacheStatuses with length == 1', () => {
        const actionTickerData = convertCacheStatusesToActionTickerData([cacheStatus1]);
        const expectedResult = {
            'MSFT': msftData
        };

        expect(actionTickerData).to.deep.equal(expectedResult);
    });

    it('works correctly with 1 cacheStatuses with length > 1', () => {
        const actionTickerData = convertCacheStatusesToActionTickerData([cacheStatus1, cacheStatus2]);
        const expectedResult = {
            'AMZN': amznData,
            'MSFT': msftData
        };

        expect(actionTickerData).to.deep.equal(expectedResult);
    });

    it('works correctly with 1 cacheStatuses with length > 1 and there is overlapping tickerName (it will use the last one)', () => {
        const actionTickerData = convertCacheStatusesToActionTickerData([
            cacheStatus1, cacheStatus2, cacheStatus1Overlap
        ]);
        const expectedResult = {
            'AMZN': amznData,
            'MSFT': []
        };

        expect(actionTickerData).to.deep.equal(expectedResult);
    });

});

describe('SAGA selectedDataChanged test', () => {

    const startDate = '20170501';
    const endDate = '20170519';

    const dateRange = {
        startDate: startDate,
        endDate: endDate
    };

    const selectedTickersObj = [
        { key: 'MSFT', value: 'MSFT' },
        { key: 'AMZN', value: 'AMZN' }
    ];

    const selectedTickersString = selectedTickersObj.map(x => x.value);

    const serverHost = 'http://serverUrl.com';
    const apiKey = 'secretApiKey';

    before(done => {
        done();
    });

    const getVariablesTest = (gen) => {
        expect(gen.next().value).to.deep.equal(select(getSelectedDate));
        expect(gen.next(dateRange).value).to.deep.equal(select(getSelectedTickers));

        expect(gen.next(selectedTickersObj).value).to.deep.equal(select(getServerHost));
        expect(gen.next(serverHost).value).to.deep.equal(select(getApiKey));

        return (nextYieldParam) => expect(gen.next(apiKey).value).to.deep.equal(nextYieldParam);
    };

    it('works properly with fully cached ticker request', (done) => {
        const gen = selectedDataChanged();
        const next = getVariablesTest(gen);

        next((selectedTickersString.map(ticker => call(quandlIDB.getCachedTickerData, ticker, startDate, endDate))));

        const fullyCachedStatuses = [
            cacheStatusFactory('MSFT', CACHE_AVAILABILITY.FULL, [], []),
            cacheStatusFactory('AMZN', CACHE_AVAILABILITY.FULL, [], [])
        ];

        let nextGen = gen.next(fullyCachedStatuses);
        const putAction = put(actionCreators.tickerDataReceived(
            convertCacheStatusesToActionTickerData(fullyCachedStatuses),
            selectedTickersObj,
            dateRange
        ));

        // since all data is fully cached, it should dispatch action
        expect(nextGen.value).to.deep.equal(putAction);

        done();
    });

});