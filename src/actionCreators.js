import * as actionTypes from './actionTypes';

export function addSelectedTicker(newSelectedTicker) {
    return {
        type: actionTypes.ADD_TICKER,
        newSelectedTicker
    }
}

export function tickerDataReceived(tickerData) {
    return {
        type: actionTypes.TICKER_DATA_RECEIVED,
        tickerData
    }
}
