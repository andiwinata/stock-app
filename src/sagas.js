import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { delay } from 'redux-saga'
import * as actionCreators from './actionCreators';
import * as actionTypes from './actionTypes';
import URI from 'urijs';

export const getApiKey = (state) => state.apiKey;

export const formatDateYYMMDD = (date) => {
    console.log(date);
    return `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
}

function* tickerSelected(action) {
    const apiKey = yield select(getApiKey);

    let fromDate = new Date(2017, 2, 1);
    // yesterday date
    let toDate = new Date();
    toDate.setDate(toDate.getDate() - 1);

    let uri = new URI('https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json')
        .setQuery({
            'api_key': apiKey,
            'ticker': action.newSelectedTickers.slice(-1)[0].value,
            'date.gte': formatDateYYMMDD(fromDate),
            'date.lte': formatDateYYMMDD(toDate)
        });

    let req = () => {
        fetch(uri, { mode: 'no-cors' })
            .then(response => {
                console.log(response);
                if (response.ok) {
                    return response;
                }
                throw new Error('response is not okay!');
            })
            .catch(error => {
                console.log('Error when fetching data', error);
            });
    };

    let response = yield call(req);

    console.log(`Uri is ${uri}`);
    yield put(actionCreators.tickerDataReceived('this is ticker tickerDataReceived'));
}

function* stockAppSaga() {
    yield takeEvery(actionTypes.ADD_TICKER, tickerSelected);
}

export default stockAppSaga;