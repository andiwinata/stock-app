import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { delay } from 'redux-saga'
import * as actionCreators from './actionCreators';
import * as actionTypes from './actionTypes';

import { processQuandlJson } from './tickerDataProcessor';
import { determineCachedStockDataStatus } from './storeFunctions';

import URI from 'urijs';

export const getApiKey = (state) => state.apiKey;
export const getServerHost = (state) => state.serverHost;
export const getSelectedDate = (state) => state.selectedDate;
export const getSelectedTickers = (state) => state.selectedTickers;
export const getStoredStockData = (state) => state.storedStockData;

export function constructRetrieveTickerDataUri(serverHost, tickers, startDate, endDate, apiKey = null) {
    let uri = new URI(serverHost)
        .setQuery({
            'ticker': tickers.slice(-1)[0].value, // right now just query 1 ticker
            'date.gte': startDate,
            'date.lte': endDate
        });

    // only set api key if not null
    if (apiKey) {
        uri.setQuery('api_key', apiKey);
    }

    return uri;
}

function* selectedInfoChanged(action) {
    // check if the ticker is cached
    const storedStockData = yield select(getStoredStockData);
    const dateRange = yield select(getSelectedDate);
    const { startDate, endDate } = dateRange;
    const tickers = yield select(getSelectedTickers);

    console.log('check ticker cache', startDate, endDate, tickers);
    // TODO REQUEST LISTS:
    // {
    //  20160101-20160202: [MSFT, FB],
    //  20160101-20160103: [MS]
    //}
    //
    const requestsList = {};
    const requestUris = [];
    tickers.forEach((ticker, index) => {
        const cacheStatus = determineCachedStockDataStatus(storedStockData, startDate, endDate, tickers);

        if (cacheStatus.needToMakeRequest) {
            // construct request Uris for every date gap
            requestUris.concat(
                cacheStatus.dateGaps.map((dateGap, index) => {
                    return constructRetrieveTickerDataUri(serverHost, [ticker], dateGap.startDate, dateGap.endDate, apiKey);
                })
            );
        }

    });

    // if not then make request to download
    const serverHost = yield select(getServerHost);
    const apiKey = yield select(getApiKey);

    let uri = constructRetrieveTickerDataUri(serverHost,
        tickers,
        startDate.format("YYYYMMDD"),
        endDate.format("YYYYMMDD"),
        apiKey
    );

    let req = () => {
        return fetch(uri)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('response is not okay!');
            })
            .then(json => {
                return json;
            })
            .catch(error => {
                console.error('Error when fetching data', error);
                return 'Error when fetching data!';
            });
    };

    let jsonResponse = yield call(req);
    const processedJson = processQuandlJson(jsonResponse);
    yield put(actionCreators.tickerDataReceived(
        processedJson,
        tickers,
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