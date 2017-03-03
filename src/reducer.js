import { combineReducers } from 'redux';
import * as actionTypes from './actionTypes';
import { processQuandlJson } from './tickerDataProcessor';
import merge from 'lodash.merge';

function selectedTickers(state = [], action) {
    switch (action.type) {
        case actionTypes.ADD_TICKER:
            const newState = action.newSelectedTickers;
            return newState;
        default:
            return state;
    }
}

function shownTickers(state = {}, action) {
    switch (action.type) {
        case actionTypes.TICKER_DATA_RECEIVED:
            return merge({}, state, processQuandlJson(action.tickerData));
        default:
            return state;
    }
}

function apiKey(state = '', action) {
    switch (action.type) {
        default:
            return state;
    }
}

function serverHost(state = '', action) {
    return state;
}

// using combineReducers to split reducers into smaller functions
// will automatically returning new state object
export default combineReducers({
    selectedTickers,
    shownTickers,
    apiKey,
    serverHost
});