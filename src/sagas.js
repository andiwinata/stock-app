import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { delay } from 'redux-saga'
import * as actionCreators from './actionCreators';
import * as actionTypes from './actionTypes';

import { processQuandlJson } from './tickerDataProcessor';
import { isTickerCached } from './storeFunctions';

import URI from 'urijs';

export const getApiKey = (state) => state.apiKey;
export const getServerHost = (state) => state.serverHost;
export const getSelectedDate = (state) => state.selectedDate;
export const getSelectedTickers = (state) => state.selectedTickers;

function* selectedInfoChanged(action) {
    // check if the ticker is cached
    const dateRange = yield select(getSelectedDate);
    const { startDate, endDate } = dateRange;
    const tickers = yield select(getSelectedTickers);

    console.log('check ticker cache', startDate, endDate, tickers);

    // if not then make request to download
    const serverHost = yield select(getServerHost);
    const apiKey = yield select(getApiKey);

    console.log('date', startDate.format("YYYYMMDD"));

    let uri = new URI(serverHost)
        .setQuery({
            'ticker': tickers.slice(-1)[0].value, // right now just query 1 ticker
            'date.gte': startDate.format("YYYYMMDD"),
            'date.lte': endDate.format("YYYYMMDD")
        });

    // only set api key if not null
    if (apiKey) {
        uri.setQuery('api_key', apiKey);
    }

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
                console.log('Error when fetching data', error);
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