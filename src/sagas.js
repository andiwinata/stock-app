import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga'
import * as actionCreators from './actionCreators';
import * as actionTypes from './actionTypes';

function* tickerSelected(action) {
    console.log("IN SAGA tickerSelected", action);
    yield delay(1000);
    console.log("after 1s delay");
    yield put (actionCreators.tickerDataReceived('this is ticker tickerDataReceived'));
}

function* stockAppSaga() {
    yield takeEvery(actionTypes.ADD_TICKER, tickerSelected);
}

export default stockAppSaga;