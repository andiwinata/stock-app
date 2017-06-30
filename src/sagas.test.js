import { stockDataComparerDate, CACHE_AVAILABILITY, cacheStatusFactory, dateGapFactory } from './cache/quandlIDB';
import { quandlIDB } from './cache/quandlIDBInstance';

import * as actionCreators from './actionCreators';

import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import mergeWith from 'lodash.mergewith';

import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import {
    getApiKey, getServerHost, getSelectedDate, fetchJson, mergeWithArrayConcat,
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

const amznDataGap1 = [
    { date: "20170110", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170111", ticker: 'AMZN', open: 25, close: 9999 },
];

const amznDataBefore = [
    { date: "20170101", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170102", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170103", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170104", ticker: 'AMZN', open: 25, close: 9999 },

    { date: "20170105", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170106", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170107", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170108", ticker: 'AMZN', open: 25, close: 9999 },
];

const amznDataGapBeforeAfter = [
    { date: "20170114", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170115", ticker: 'AMZN', open: 35, close: 456 },
    { date: "20170116", ticker: 'AMZN', open: 42, close: 12 },
];

const amznDataAfter = [
    { date: "20170117", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170118", ticker: 'AMZN', open: 35, close: 456 },
    { date: "20170119", ticker: 'AMZN', open: 42, close: 12 },
    { date: "20170120", ticker: 'AMZN', open: 25, close: 9999 },
    { date: "20170121", ticker: 'AMZN', open: 35, close: 456 },
    { date: "20170122", ticker: 'AMZN', open: 42, close: 12 },
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

const googDataGap1 = [
    { date: "20170104", ticker: 'GOOG', open: 50, close: 100 },
    { date: "20170105", ticker: 'GOOG', open: 75, close: 551 }
];

const googDataGap2 = [
    { date: "20170109", ticker: 'GOOG', open: 50, close: 100 }
];

const googDataGap3 = [
    { date: "20170113", ticker: 'GOOG', open: 50, close: 100 },
    { date: "20170114", ticker: 'GOOG', open: 75, close: 551 },
    { date: "20170115", ticker: 'GOOG', open: 75, close: 551 },
    { date: "20170116", ticker: 'GOOG', open: 75, close: 551 },
    { date: "20170117", ticker: 'GOOG', open: 75, close: 551 },
];

const fbData = [
    { date: "20170106", ticker: 'FB', open: 1, close: 151 },
    { date: "20170107", ticker: 'FB', open: 2, close: 121 },

    { date: "20170110", ticker: 'FB', open: 4, close: 324 },
    { date: "20170111", ticker: 'FB', open: 5, close: 435 },
    { date: "20170112", ticker: 'FB', open: 6, close: 123 },
];

const aaplData = [
    { date: "20170101", ticker: 'AAPL', open: 1, close: 151 },
    { date: "20170102", ticker: 'AAPL', open: 2, close: 121 },
    { date: "20170103", ticker: 'AAPL', open: 4, close: 324 },
    { date: "20170104", ticker: 'AAPL', open: 5, close: 435 },
    { date: "20170105", ticker: 'AAPL', open: 6, close: 123 },

    { date: "20170106", ticker: 'AAPL', open: 1, close: 151 },
    { date: "20170107", ticker: 'AAPL', open: 2, close: 121 },
    { date: "20170108", ticker: 'AAPL', open: 2, close: 121 },
    { date: "20170109", ticker: 'AAPL', open: 2, close: 121 },
    { date: "20170110", ticker: 'AAPL', open: 4, close: 324 },

    { date: "20170111", ticker: 'AAPL', open: 5, close: 435 },
    { date: "20170112", ticker: 'AAPL', open: 6, close: 123 },
    { date: "20170113", ticker: 'AAPL', open: 1, close: 151 },
    { date: "20170114", ticker: 'AAPL', open: 2, close: 121 },
    { date: "20170115", ticker: 'AAPL', open: 4, close: 324 },

    { date: "20170116", ticker: 'AAPL', open: 5, close: 435 },
    { date: "20170117", ticker: 'AAPL', open: 6, close: 123 },
];

describe('convertCacheStatusesToActionTickerData test', () => {

    const cacheStatus1 = cacheStatusFactory('MSFT', CACHE_AVAILABILITY.FULL, msftData, []);
    const cacheStatus2 = cacheStatusFactory('AMZN', CACHE_AVAILABILITY.FULL, amznData, []);

    const cacheStatus1Overlap = cacheStatusFactory('MSFT', CACHE_AVAILABILITY.NONEL, [], []);

    const cacheStatus3 = cacheStatusFactory('GOOG', CACHE_AVAILABILITY.FULL, googData, []);
    const cacheStatus4 = cacheStatusFactory('FB', CACHE_AVAILABILITY.FULL, fbData, []);

    it('works correctly with 1 cacheStatuses without array', () => {
        const actionTickerData = convertCacheStatusesToActionTickerData(cacheStatus1);
        const expectedResult = {
            'MSFT': msftData
        };

        expect(actionTickerData).to.deep.equal(expectedResult);
    });

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
        const requestEndDate = '20170117';
        const selectedData = createSelectedDataVariables(requestStartDate, requestEndDate, 'GOOG');

        testSelectedDataChangedUntilGetCache(gen, selectedData);

        const cachedData = googData.sort(stockDataComparerDate).filter(
            data => moment(data.date).isBetween(requestStartDate, requestEndDate, 'days', '[]')
        );

        const expectedDateGaps = [
            dateGapFactory(requestStartDate, '20170105'),
            dateGapFactory('20170109', '20170109'),
            dateGapFactory('20170113', requestEndDate),
        ];

        const partialCacheStatuses = [
            cacheStatusFactory(
                'GOOG',
                CACHE_AVAILABILITY.PARTIAL,
                cachedData,
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
            { GOOG: googDataGap1.slice(0) },
            { GOOG: googDataGap2.slice(0) },
            { GOOG: googDataGap3.slice(0) }
        ];

        const mergedProcessedJson = mergeWith({}, ...processedJsons, mergeWithArrayConcat);

        const allTickerData = mergeWith({}, { GOOG: cachedData }, mergedProcessedJson, mergeWithArrayConcat);
        // sort partial data
        allTickerData['GOOG'].sort(stockDataComparerDate);

        // the put action will be dispatched to store        
        const putAction = put(actionCreators.tickerDataReceived(
            allTickerData,
            selectedData.selectedTickersObj,
            selectedData.dateRange
        ));

        const nextGenValue = gen.next(processedJsons).value;
        expect(nextGenValue).to.deep.equal([
            putAction,
            call(quandlIDB.putTickerData, [].concat(...Object.values(allTickerData)), requestStartDate, requestEndDate),
        ]);

        done();
    });

    it('works properly with non cached ticker request', (done) => {
        const gen = selectedDataChanged();
        const requestStartDate = '20170115';
        const requestEndDate = '20170125';
        const selectedData = createSelectedDataVariables(requestStartDate, requestEndDate, 'AMZN');

        testSelectedDataChangedUntilGetCache(gen, selectedData);

        const expectedDateGaps = [
            dateGapFactory(requestStartDate, requestEndDate)
        ];

        const nonCachedStatuses = [
            cacheStatusFactory('AMZN', CACHE_AVAILABILITY.NONE, [], expectedDateGaps)
        ];

        const uris = generateUrisFromCacheStatuses(nonCachedStatuses, serverHost, apiKey);
        const urisPromises = uris.map(uri => call(fetchJson, uri));

        // make sure the request to fetchJSON is correct
        expect(gen.next(nonCachedStatuses).value).to.deep.equal(urisPromises);

        const jsonResponses = [];
        expect(gen.next(jsonResponses).value).to.deep.equal([]);

        const processedJsons = [
            { AMZN: amznDataAfter.slice(0).sort(stockDataComparerDate) }
        ];

        // since there is no cached data, processedJson = allTickerData
        const mergedProcessedJson = mergeWith({}, ...processedJsons, mergeWithArrayConcat);
        const mergedProcessedJsonData = mergedProcessedJson['AMZN'];

        // the put action will be dispatched to store        
        const putAction = put(actionCreators.tickerDataReceived(
            mergedProcessedJson,
            selectedData.selectedTickersObj,
            selectedData.dateRange
        ));

        const nextGenValue = gen.next(processedJsons).value;
        expect(nextGenValue).to.deep.equal([
            putAction,
            call(quandlIDB.putTickerData, mergedProcessedJsonData, requestStartDate, requestEndDate)
        ]);

        done();
    });

    it('works properly with mixed cache statuses and multiple tickers request', (done) => {
        const gen = selectedDataChanged();
        const requestStartDate = '20170101';
        const requestEndDate = '20170117';
        const selectedData = createSelectedDataVariables(requestStartDate, requestEndDate, 'GOOG', 'AMZN', 'AAPL');

        testSelectedDataChangedUntilGetCache(gen, selectedData);

        const combinedGoogData = [...googData, ...googDataGap1, ...googDataGap2, ...googDataGap3];
        const expectedDateGapsGoog = [];
        const combinedAmznData = [...amznData, ...amznDataAfter];

        const cachedGoogData = combinedGoogData.sort(stockDataComparerDate).filter(
            data => moment(data.date).isBetween(requestStartDate, requestEndDate, 'days', '[]')
        );
        const cachedAmznData = combinedAmznData.sort(stockDataComparerDate).filter(
            data => moment(data.date).isBetween(requestStartDate, requestEndDate, 'days', '[]')
        );

        const expectedDateGapsAmzn = [
            dateGapFactory('20170101', '20170108'),
            dateGapFactory('20170110', '20170111'),
            dateGapFactory('20170114', '20170116')
        ];
        const expectedDateGapsAapl = [
            dateGapFactory('20170101', '20170117')
        ];

        const cachedStockStatuses = [
            cacheStatusFactory(
                'GOOG',
                CACHE_AVAILABILITY.FULL,
                cachedGoogData,
                expectedDateGapsGoog
            ),
            cacheStatusFactory(
                'AMZN',
                CACHE_AVAILABILITY.PARTIAL,
                cachedAmznData,
                expectedDateGapsAmzn
            ),
            cacheStatusFactory(
                'AAPL',
                CACHE_AVAILABILITY.NONE,
                [],
                expectedDateGapsAapl
            )
        ];

        const uris = generateUrisFromCacheStatuses(cachedStockStatuses, serverHost, apiKey);
        const urisPromises = uris.map(uri => call(fetchJson, uri));

        // make sure the request to fetchJSON is correct
        expect(gen.next(cachedStockStatuses).value).to.deep.equal(urisPromises);

        const jsonResponses = [];
        expect(gen.next(jsonResponses).value).to.deep.equal([]);

        const processedJsons = [
            { AMZN: amznDataBefore.slice(0) },
            { AMZN: amznDataGap1.slice(0) },
            { AMZN: amznDataGapBeforeAfter.slice(0) },
            { AAPL: aaplData.slice(0).sort(stockDataComparerDate) }
        ];

        const cachedData = {
            'GOOG': cachedGoogData,
            'AMZN': cachedAmznData
        };

        const mergedProcessedJson = mergeWith({}, ...processedJsons, mergeWithArrayConcat);
        const mergedAllRequestedData = mergeWith({}, combinedGoogData, mergedProcessedJson, mergeWithArrayConcat);

        const allTickerData = mergeWith({}, cachedData, mergedProcessedJson, mergeWithArrayConcat);
        // sort partial data
        allTickerData['AMZN'].sort(stockDataComparerDate);

        // the put action will be dispatched to store        
        const putAction = put(actionCreators.tickerDataReceived(
            allTickerData,
            selectedData.selectedTickersObj,
            selectedData.dateRange
        ));

        const allTickerJsonData = [].concat(...Object.values(allTickerData));

        const nextGenValue = gen.next(processedJsons).value;
        expect(nextGenValue).to.deep.equal([
            putAction,
            call(quandlIDB.putTickerData, allTickerJsonData, requestStartDate, requestEndDate)
        ]);

        done();
    });

});