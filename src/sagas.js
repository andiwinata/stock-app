import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { delay } from 'redux-saga'
import * as actionCreators from './actionCreators';
import * as actionTypes from './actionTypes';

import { processQuandlJson } from './api/tickerDataProcessor';
import { determineCachedStockDataStatus, CACHE_AVAILABILITY } from './storeFunctions';
import { constructRetrieveTickerDataUri, getRequestUrisForCacheStatuses } from './api/requestFunctions';

import merge from 'lodash.merge';

export const getApiKey = (state) => state.apiKey;
export const getServerHost = (state) => state.serverHost;
export const getSelectedDate = (state) => state.selectedDate;
export const getSelectedTickers = (state) => state.selectedTickers;
export const getStoredStockData = (state) => state.storedStockData;

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
        return determineCachedStockDataStatus(storedStockData, startDate, endDate, ticker);
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
        processQuandlJson(resp, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'))
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