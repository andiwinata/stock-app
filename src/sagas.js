import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { delay } from 'redux-saga'
import * as actionCreators from './actionCreators';
import * as actionTypes from './actionTypes';

import { processQuandlJson, processQuandlJsonIDB } from './api/tickerDataProcessor';
import { generateUrisFromCacheStatuses } from './api/requestFunctions';

import { quandlIDB } from './cache/quandlIDBInstance';
import { stockDataComparerDate, CACHE_AVAILABILITY } from './cache/quandlIDB';

import merge from 'lodash.merge';
import mergeWith from 'lodash.mergewith';

export const getApiKey = (state) => state.apiKey;
export const getServerHost = (state) => state.serverHost;
export const getSelectedDate = (state) => state.selectedDate;
export const getSelectedTickers = (state) => state.selectedTickers;

export const getStoredStockData = (state) => state.storedStockData;

const requestDateFormat = 'YYYYMMDD';

export function fetchJson(uri) {
    return fetch(uri)
        .then(resp => {
            if (resp.ok) {
                return resp.json();
            }
            throw new Error(`response is not okay! Status: ${response.status}, StatusText: ${response.statusText}`);
        });
}

export function mergeWithArrayConcat(objValue, srcValue) {
    if (Array.isArray(objValue)) {
        return objValue.concat(srcValue);
    }
};

function createProcessedCacheStatus(status) {
    return { [status.tickerName]: status.cacheData }
};

export function convertCacheStatusesToActionTickerData(...multipleCacheStatuses) {
    // since cacheStatuses is an array
    // and the passed param is multipleCacheStatuses
    // so we'll flatten the array
    const concatenatedCacheStatuses = [].concat(...multipleCacheStatuses);
    // then assign an empty object with every processed cacheStatus from flattened cacheStatuses array
    const actionTickerData = Object.assign({},
        ...concatenatedCacheStatuses.map(createProcessedCacheStatus)
    );

    return actionTickerData;
};

export function* selectedDataChanged(action) {
    // get selected date
    const dateRange = yield select(getSelectedDate);
    const { startDate, endDate } = dateRange;
    // get selected tickers
    const selectedTickersObj = yield select(getSelectedTickers);
    // get the string of tickers
    const selectedTickersString = selectedTickersObj.map(selectedTickerObj => selectedTickerObj.value);

    const serverHost = yield select(getServerHost);
    const apiKey = yield select(getApiKey);

    // check cache
    // http://stackoverflow.com/questions/40043644/redux-saga-how-to-create-multiple-calls-side-effects-programmatically-for-yield
    const cachedStockStatuses = yield selectedTickersString.map(ticker => call(quandlIDB.getCachedTickerData, ticker, startDate, endDate));

    const fullyCachedStatuses = cachedStockStatuses.filter(status => status.cacheAvailability === CACHE_AVAILABILITY.FULL);
    const partiallyCachedStatuses = cachedStockStatuses.filter(status => status.cacheAvailability === CACHE_AVAILABILITY.PARTIAL);
    const nonCachedStatuses = cachedStockStatuses.filter(status => status.cacheAvailability === CACHE_AVAILABILITY.NONE);

    // meaning everything is cached
    if (partiallyCachedStatuses.length === 0 && nonCachedStatuses.length === 0) {
        yield put(actionCreators.tickerDataReceived(
            convertCacheStatusesToActionTickerData(fullyCachedStatuses),
            selectedTickersObj,
            dateRange
        ));
        return;
    }

    // get urls to download missing data for partially/non-cached data
    const uris = generateUrisFromCacheStatuses([...partiallyCachedStatuses, ...nonCachedStatuses], serverHost, apiKey);

    // get the json data from making request, then process the json
    const jsonResponses = yield uris.map(uri => call(fetchJson, uri));
    // processingJson is not async, but using yield instead for easier test
    const processedJsons = yield jsonResponses.map(jsonResp =>
        call(processQuandlJsonIDB, jsonResp)
    );
    // combine processedJson into 1 object
    const combinedProcessedJson = mergeWith({}, ...processedJsons, mergeWithArrayConcat);

    // concatenate the cached data into one (the fully cached one and the partially cached)
    const tickerData = convertCacheStatusesToActionTickerData(fullyCachedStatuses, partiallyCachedStatuses);

    // merge cached data with responses data
    mergeWith(tickerData, combinedProcessedJson, mergeWithArrayConcat);

    // sort the merge of partially cached data
    const partiallyCachedTickerNames = partiallyCachedStatuses.forEach(status => {
        tickerData[status.tickerName].sort(stockDataComparerDate);
    });

    // get array of ALL data to be passed in for IDB cache
    // (not just only response data, but including cached data
    // since it is a bit tricky to pass in startDate and endDate later on for putTickerData
    // because the response comes with multiple dateGaps
    // and will need to do a lot processing to put the ticker data based on
    // their correct startDate and endDate)
    const tikerJsonData = [].concat(...Object.values(tickerData));

    yield [
        // send put request with new data
        put(actionCreators.tickerDataReceived(
            tickerData,
            selectedTickersObj,
            dateRange
        )),
        // put the processed Json to IDB
        call(quandlIDB.putTickerData, tikerJsonData, startDate, endDate)
    ];
}

export default function* stockAppSaga() {
    yield takeEvery([actionTypes.SELECTED_TICKER_CHANGED, actionTypes.SELECTED_DATE_CHANGED], selectedDataChanged);
}