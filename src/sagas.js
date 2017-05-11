import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { delay } from 'redux-saga'
import * as actionCreators from './actionCreators';
import * as actionTypes from './actionTypes';

import { processQuandlJson, processQuandlJsonIDB } from './api/tickerDataProcessor';
import { determineCachedStockDataStatus, CACHE_AVAILABILITY } from './storeFunctions';
import { constructRetrieveTickerDataUri, getRequestUrisForCacheStatuses, generateUrisFromCacheStatuses } from './api/requestFunctions';

import { quandlIDB } from './index';
import { stockDataComparer } from './cache/quandlIDB';

import merge from 'lodash.merge';
import mergeWith from 'lodash.mergewith';

export const getApiKey = (state) => state.apiKey;
export const getServerHost = (state) => state.serverHost;
export const getSelectedDate = (state) => state.selectedDate;
export const getSelectedTickers = (state) => state.selectedTickers;

export const getStoredStockData = (state) => state.storedStockData;

const requestDateFormat = 'YYYYMMDD';

export const fetchJson = (uri) =>
    fetch(uri)
        .then(resp => {
            if (resp.ok) {
                return resp.json();
            }
            throw new Error(`response is not okay! Status: ${response.status}, StatusText: ${response.statusText}`);
        });

export const mergeWithArrayConcat = (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
        return objValue.concat(srcValue);
    }
};

function* selectedDataChanged(action) {
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
            fullyCachedStatuses.cacheData,
            selectedTickersObj,
            dateRange
        ));
        return;
    }

    // get urls to download missing data for partially/non-cached data
    const uris = generateUrisFromCacheStatuses([...partiallyCachedStatuses, ...nonCachedStatuses], serverHost, apiKey);

    // get the json data from making request, then process the json
    const jsonResponses = yield uris.map(uri => fetchJson(uri));
    const processedJson = jsonResponses.map(jsonResp => processQuandlJson(jsonResp, startDate, endDate));

    // concatenate the data into one
    const tickerData = Object.assign(
        {},
        ...fullyCachedStatuses.map(status => status.cacheData),
        ...partiallyCachedStatuses.map(status => status.cacheData)
    );

    // merge cache with responses
    mergeWith(tickerData, jsonResponses, mergeWithArrayConcat);

    // sort the merge of partially cached data
    const partiallyCachedTickerNames = partiallyCachedStatuses.forEach(status => {
        tickerData[status.tickerName].sort(stockDataComparer);
    });

    yield [
        // send put request with new data
        put(actionCreators.tickerDataReceived(
            tickerData,
            selectedTickersObj,
            dateRange
        )),
        // put the processed Json to IDB
        call(quandlIDB.putTickerData, tickerData, startDate, endDate)
    ];
}

function* selectedInfoChanged(action) {
    // check if the ticker is cached
    const storedStockData = yield select(getStoredStockData);

    // get selected date
    const dateRange = yield select(getSelectedDate);
    const { startDate, endDate } = dateRange;
    // get selected tickers
    const selectedTickersObj = yield select(getSelectedTickers);
    // get the string of tickers
    const selectedTickersString = selectedTickersObj.map(selectedTickerObj => selectedTickerObj.value);

    const serverHost = yield select(getServerHost);
    const apiKey = yield select(getApiKey);

    console.log('check ticker cache', startDate, endDate, selectedTickersString);

    // get cacheStatus for each ticker
    const cachedStockDataStatuses = selectedTickersString.map(ticker => {
        return determineCachedStockDataStatus(storedStockData, startDate, endDate, ticker, requestDateFormat);
    });

    // split into 3 categories
    const fullyCachedStatuses = cachedStockDataStatuses.filter(cacheStatus => cacheStatus.cacheAvailability === CACHE_AVAILABILITY.FULL);
    const partiallyCachedStatuses = cachedStockDataStatuses.filter(cacheStatus => cacheStatus.cacheAvailability === CACHE_AVAILABILITY.PARTIAL);
    const nonCachedStatuses = cachedStockDataStatuses.filter(cacheStatus => cacheStatus.cacheAvailability === CACHE_AVAILABILITY.NONE);

    console.log('CACHE STATUSES', fullyCachedStatuses, partiallyCachedStatuses, nonCachedStatuses);

    const cachedTickerNames = [
        ...fullyCachedStatuses.map(cacheStatus => cacheStatus.ticker),
        ...partiallyCachedStatuses.map(cacheStatus => cacheStatus.ticker),
    ];
    console.log("CACHED TICKER NAMES:", cachedTickerNames);

    const cachedStockData = {};
    cachedTickerNames.forEach((tickerName) => {
        cachedStockData[tickerName] = storedStockData[tickerName];
    });

    console.log("CACHED STOCK DATA", cachedStockData);

    // check if no non-cached data
    if (partiallyCachedStatuses.length === 0 && nonCachedStatuses.length === 0) {
        // no need to make request, just return cached data
        yield put(actionCreators.tickerDataReceived(
            cachedStockData,
            selectedTickersObj,
            dateRange
        ));
        return;
    }

    const requestUris = getRequestUrisForCacheStatuses(serverHost, [...partiallyCachedStatuses, ...nonCachedStatuses], apiKey);
    console.log("REQUEST URIS", requestUris);

    const uriPromises = requestUris.map(uri => fetch(uri)
        .then(resp => {
            console.log('RESPONSE', resp);
            if (resp.ok) {
                return resp.json();
            }
            throw new Error('response is not okay!');
        })
    );

    const allRequests = () => Promise.all(uriPromises)
        .then(jsonResponses => Promise.all(jsonResponses));

    const jsonResponses = yield call(allRequests);

    const processedJsons = jsonResponses.map(resp =>
        processQuandlJson(resp, startDate, endDate)
    );
    const combinedJsonResponses = merge({}, cachedStockData, ...processedJsons);

    console.log("COMBINED JSON RESPONSES", combinedJsonResponses);
    yield put(actionCreators.tickerDataReceived(
        combinedJsonResponses,
        selectedTickersObj,
        dateRange
    ));
}

function* stockAppSaga() {
    yield [
        takeEvery(
            [actionTypes.SELECTED_TICKER_CHANGED, actionTypes.SELECTED_DATE_CHANGED],
            selectedInfoChanged
        )
    ];
}

export default stockAppSaga;