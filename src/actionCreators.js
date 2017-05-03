import * as actionTypes from './actionTypes';

export function selectedTickerChanged(selectedTickers) {
    // convert to array if not array
    if (selectedTickers.constructor !== Array) {
        selectedTickers = [selectedTickers];
    }
    return {
        type: actionTypes.SELECTED_TICKER_CHANGED,
        selectedTickers
    };
}

export function selectedDateChanged(selectedDate) {
    // make sure date object is valid
    if (!('startDate' in selectedDate && 'endDate' in selectedDate)) {
        throw Error('startDate and endDate must be in the newDate object');
    }
    return {
        type: actionTypes.SELECTED_DATE_CHANGED,
        selectedDate
    };
}

export function tickerDataReceived(receivedTickerData, receivedTickers, receivedDate) {
    return {
        type: actionTypes.TICKER_DATA_RECEIVED,
        receivedTickerData,
        receivedTickers,
        receivedDate
    };
}
