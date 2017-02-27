import * as actionTypes from './actionTypes';

export function addSelectedTicker(newSelectedTickers) {
    return {
        type: actionTypes.ADD_TICKER,
        newSelectedTickers
    }
}

export function tickerDataReceived(tickerData) {
    return {
        type: actionTypes.TICKER_DATA_RECEIVED,
        tickerData
    }
}
