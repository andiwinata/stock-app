import { combineReducers } from 'redux';
import * as actionTypes from './actionTypes';
import mergeWith from 'lodash.mergewith';
import merge from 'lodash.merge';
import moment from 'moment';
import { initialSelectedDate } from './initialState';

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

export function storedStockMergeCustomizer(objValue, srcValue) {
    if (!objValue || !srcValue) {
        return merge(objValue, srcValue);
    }

    if ("startDate" in objValue && "endDate" in objValue) {
        // if store startDate is earlier than received one
        if (moment(objValue.startDate).isBefore(srcValue.startDate)) {
            // replace the srcValue with objValue to retain the earliest date
            srcValue.startDate = objValue.startDate;
        }
        // if source endDate is later than received one
        if (moment(objValue.endDate).isAfter(srcValue.endDate)) {
            // replace the srcValue with objValue to retain the latest date
            srcValue.endDate = objValue.endDate;
        }
    }
    return merge(objValue, srcValue);
}

export function storedStockData(state = {}, action) {
    switch (action.type) {
        case actionTypes.TICKER_DATA_RECEIVED:
            return mergeWith({}, state, action.receivedTickerData, storedStockMergeCustomizer);
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
    selectedTickers,
    selectedDate,
    shownTickers,
    shownDate,
    storedStockData,
    shownStockData,
    apiKey,
    serverHost
});