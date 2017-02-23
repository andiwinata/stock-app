import { combineReducers } from 'redux';
import * as actionTypes from './actionTypes';

function selectedTickers(state = [], action) {
    switch (action.type) {
        case actionTypes.ADD_TICKER:
            console.log("Reducer receives addticker");
            const newState = action.newSelectedTicker;
            return newState;
        default:
            return state;
    }
}

function shownTickers(state = [], action) {
    switch (action.type) {
        case actionTypes.TICKER_DATA_RECEIVED:
            console.log('reducer receives ticker data');
            return [...state, action.tickerData];
        default:
            return state;
    }
}

// using combineReducers to split reducers into smaller functions
// will automatically returning new state object
export default combineReducers({
    selectedTickers,
    shownTickers
});