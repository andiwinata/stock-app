import { combineReducers } from 'redux';
import * as actionTypes from './actionTypes';
import merge from 'lodash.merge';
import { initialSelectedDate } from './initialState';

function selectedTickers(state = [], action) {
    switch (action.type) {
        case actionTypes.SELECTED_TICKER_CHANGED:
            const newState = [...action.selectedTickers];
            return newState;
        default:
            return state;
    }
}

function selectedDate(state = initialSelectedDate, action) {
    switch (action.type) {
        case actionTypes.SELECTED_DATE_CHANGED:
            return Object.assign({}, action.selectedDate);
        default:
            return state;
    }
}

function shownTickers(state = [], action) {
    switch (action.type) {
        case actionTypes.TICKER_DATA_RECEIVED:
            return [...action.receivedTickers];
        default:
            return state;
    }
}

function shownDate(state = {}, action) {
    switch (action.type) {
        case actionTypes.TICKER_DATA_RECEIVED:
            return Object.assign({}, action.receivedDate);
        default:
            return state;
    }
}

function storedStockData(state = {}, action) {
    switch (action.type) {
        case actionTypes.TICKER_DATA_RECEIVED:
            // TODO this should not just naive merge but also take care of start and end date
            return merge({}, state, action.receivedTickerData);
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
    selectedDate,
    shownTickers,
    shownDate,
    storedStockData,
    apiKey,
    serverHost
    // to add stored ticker data
});