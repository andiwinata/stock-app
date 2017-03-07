import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { delay } from 'redux-saga'
import * as actionCreators from './actionCreators';
import * as actionTypes from './actionTypes';
import URI from 'urijs';

export const getApiKey = (state) => state.apiKey;
export const getServerHost = (state) => state.serverHost;

export const formatDateYYMMDD = (date) => {
    let yyyy = date.getFullYear();

    let mm = date.getMonth() + 1;
    mm = mm > 9 ? mm : '0' + mm;

    let dd = date.getDate();
    dd = dd > 9 ? dd : '0' + dd;

    return `${yyyy}${mm}${dd}`;
}

function* tickerSelected(action) {
    // check if the ticker is cached

    // if not then make request to download
    const serverHost = yield select(getServerHost);
    const apiKey = yield select(getApiKey);

    let fromDate = new Date(2017, 0, 1);
    // yesterday date
    let toDate = new Date();
    toDate.setDate(toDate.getDate() - 1);

    let uri = new URI(serverHost)
        .setQuery({
            'ticker': action.selectedTickers.slice(-1)[0].value,
            'date.gte': formatDateYYMMDD(fromDate),
            'date.lte': formatDateYYMMDD(toDate)
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
    yield put(actionCreators.fetchTickerDataReceived(jsonResponse));
}

function* stockAppSaga() {
    yield takeEvery(actionTypes.SELECTED_TICKER_CHANGED, tickerSelected);
}

export default stockAppSaga;