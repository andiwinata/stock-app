import { combineReducers } from 'redux';
import * as actionTypes from './actionTypes';
import mergeWith from 'lodash.mergewith';
import merge from 'lodash.merge';
import moment from 'moment';
import { initialSelectedDate } from './initialState';

export function chartType(state = '', action) {
    switch(action.type) {
        case actionTypes.CHART_TYPE_CHANGED:
            return action.chartType;
        default:
            return state;
    }
}

export function selectedTickers(state = [], action) {
    switch (action.type) {
        case actionTypes.SELECTED_TICKER_CHANGED:
            const newState = [...action.selectedTickers];
            return newState;
        default:
            return state;
    }
}

export function selectedDate(state = initialSelectedDate, action) {
    switch (action.type) {
        case actionTypes.SELECTED_DATE_CHANGED:
            return Object.assign({}, action.selectedDate);
        default:
            return state;
    }
}

export function shownTickers(state = [], action) {
    switch (action.type) {
        case actionTypes.TICKER_DATA_RECEIVED:
            return [...action.receivedTickers];
        default:
            return state;
    }
}

export function shownDate(state = {}, action) {
    switch (action.type) {
        case actionTypes.TICKER_DATA_RECEIVED:
            return Object.assign({}, action.receivedDate);
        default:
            return state;
    }
}

export function shownStockData(state = {}, action) {
    switch (action.type) {
        case actionTypes.TICKER_DATA_RECEIVED:
            return action.receivedTickerData;
        default:
            return state;        
    }
}

export function apiKey(state = '', action) {
    switch (action.type) {
        default:
            return state;
    }
}

export function serverHost(state = '', action) {
    return state;
}

// using combineReducers to split reducers into smaller functions
// will automatically returning new state object
export default combineReducers({
    chartType,
    selectedTickers,
    selectedDate,
    shownTickers,
    shownDate,
    shownStockData,
    apiKey,
    serverHost
});