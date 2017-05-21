import { stockDataComparer, CACHE_AVAILABILITY, cacheStatusFactory, dateGapFactory } from './cache/quandlIDB';
import { quandlIDB } from './cache/quandlIDBInstance';

import * as actionCreators from './actionCreators';

import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment';

import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import {
    getApiKey, getServerHost, getSelectedDate, fetchJson,
    getSelectedTickers, getStoredStockData, convertCacheStatusesToActionTickerData,
    selectedDataChanged
} from './sagas';

import { processQuandlJsonIDB } from './api/tickerDataProcessor';
import { generateUrisFromCacheStatuses } from './api/requestFunctions';

const amznData = [
    { date: "20170109", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170112", ticker: 'AMZN', open: 35, close: 456 },
    { date: "20170113", ticker: 'AMZN', open: 42, close: 12 },
];

const msftData = [
    { date: "20170106", ticker: 'MSFT', open: 50, close: 100 },
    { date: "20170107", ticker: 'MSFT', open: 11, close: 312 },
    { date: "20170108", ticker: 'MSFT', open: 75, close: 551 },
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

const fbData = [
    { date: "20170106", ticker: 'FB', open: 1, close: 151 },
    { date: "20170107", ticker: 'FB', open: 2, close: 121 },

    { date: "20170110", ticker: 'FB', open: 4, close: 324 },
    { date: "20170111", ticker: 'FB', open: 5, close: 435 },
    { date: "20170112", ticker: 'FB', open: 6, close: 123 },
];

describe('convertCacheStatusesToActionTickerData test', () => {

    const cacheStatus1 = cacheStatusFactory('MSFT', CACHE_AVAILABILITY.FULL, msftData, []);
    const cacheStatus2 = cacheStatusFactory('AMZN', CACHE_AVAILABILITY.FULL, amznData, []);

    const cacheStatus1Overlap = cacheStatusFactory('MSFT', CACHE_AVAILABILITY.NONEL, [], []);

    const cacheStatus3 = cacheStatusFactory('GOOG', CACHE_AVAILABILITY.FULL, googData, []);
    const cacheStatus4 = cacheStatusFactory('FB', CACHE_AVAILABILITY.FULL, fbData, []);

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

    it('works correctly with > 1 cacheStatuses with length > 1', () => {
        const actionTickerData = convertCacheStatusesToActionTickerData(
            [cacheStatus1, cacheStatus2],
            [cacheStatus3],
            cacheStatus4
        );
        const expectedResult = {
            'AMZN': amznData,
            'MSFT': msftData,
            'GOOG': googData,
            'FB': fbData
        };

        expect(actionTickerData).to.deep.equal(expectedResult);
    });

});

describe('SAGA selectedDataChanged test', () => {

    const serverHost = 'http://serverUrl.com';
    const apiKey = 'secretApiKey';

    before(done => {
        done();
    });

    const createSelectedDataVariables = (startDate, endDate, ...tickers) => {
        return {
            startDate,
            endDate,
            dateRange: { startDate, endDate },
            selectedTickersObj: tickers.map(ticker => {
                return { key: ticker, value: ticker }
            }),
            selectedTickersString: tickers
        }
    };

    const testSelectedDataChangedUntilGetCache = (gen, selectedData) => {
        expect(gen.next().value).to.deep.equal(select(getSelectedDate));
        expect(gen.next(selectedData.dateRange).value).to.deep.equal(select(getSelectedTickers));

        expect(gen.next(selectedData.selectedTickersObj).value).to.deep.equal(select(getServerHost));
        expect(gen.next(serverHost).value).to.deep.equal(select(getApiKey));

        const callGetCacheData = selectedData.selectedTickersString.map(ticker =>
            call(quandlIDB.getCachedTickerData, ticker, selectedData.startDate, selectedData.endDate)
        );

        expect(gen.next(apiKey).value).to.deep.equal(callGetCacheData);
    };

    it('works properly with fully cached ticker request', (done) => {
        const gen = selectedDataChanged();
        const selectedData = createSelectedDataVariables('20170104', '20170119', 'MSFT', 'AMZN');

        testSelectedDataChangedUntilGetCache(gen, selectedData);

        const fullyCachedStatuses = [
            cacheStatusFactory('MSFT', CACHE_AVAILABILITY.FULL, [], []),
            cacheStatusFactory('AMZN', CACHE_AVAILABILITY.FULL, [], [])
        ];

        const putAction = put(actionCreators.tickerDataReceived(
            convertCacheStatusesToActionTickerData(fullyCachedStatuses),
            selectedData.selectedTickersObj,
            selectedData.dateRange
        ));

        // since all data is fully cached, it should dispatch action
        expect(gen.next(fullyCachedStatuses).value).to.deep.equal(putAction);

        done();
    });

    it('works properly with partially cached ticker request', (done) => {
        const gen = selectedDataChanged();
        const requestStartDate = '20170104';
        const requestEndDate = '20170115';
        const selectedData = createSelectedDataVariables(requestStartDate, requestEndDate, 'GOOG');

        testSelectedDataChangedUntilGetCache(gen, selectedData);

        const expectedDateGaps = [
            dateGapFactory(requestStartDate, '20170105'),
            dateGapFactory('20170109', '20170109'),
            dateGapFactory('20170113', requestEndDate),
        ];

        const partialCacheStatuses = [
            cacheStatusFactory(
                'GOOG',
                CACHE_AVAILABILITY.PARTIAL,
                googData.sort(stockDataComparer).filter(
                    data => moment(data.date).isBetween(requestStartDate, requestEndDate, 'days', '[]')
                ),
                expectedDateGaps
            )
        ];

        const uris = generateUrisFromCacheStatuses(partialCacheStatuses, serverHost, apiKey);
        const urisPromises = uris.map(uri => call(fetchJson, uri));

        // make sure the request to fetchJSON is correct
        expect(gen.next(partialCacheStatuses).value).to.deep.equal(urisPromises);

        const jsonResponses = [];
        expect(gen.next(jsonResponses).value).to.deep.equal([]);

        const processedJsons = [
            {
                GOOG: [
                    { date: '20170104', ticker: 'GOOG', adj_open: 78.58, adj_high: 78.93, adj_low: 77.7, adj_close: 78.45, adj_volume: 18177475 },
                    { date: '20170105', ticker: 'GOOG', adj_open: 77.98, adj_high: 79.2455, adj_low: 76.86, adj_close: 77.19, adj_volume: 26452191 }
                ]
            },
            {
                GOOG: [
                    { date: '20170109', ticker: 'GOOG', adj_open: 78.58, adj_high: 78.93, adj_low: 77.7, adj_close: 78.45, adj_volume: 18177475 }
                ]
            },
            {
                GOOG: [
                    { date: '20170113', ticker: 'GOOG', adj_open: 78.58, adj_high: 78.93, adj_low: 77.7, adj_close: 78.45, adj_volume: 18177475 },
                    { date: '20170114', ticker: 'GOOG', adj_open: 77.98, adj_high: 79.2455, adj_low: 76.86, adj_close: 77.19, adj_volume: 26452191 },
                    { date: '20170115', ticker: 'GOOG', adj_open: 77.98, adj_high: 79.2455, adj_low: 76.86, adj_close: 77.19, adj_volume: 26452191 }
                ]
            }
        ];

        done();
    });

});