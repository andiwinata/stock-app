import { combineReducers } from 'redux';

function selectedTickers(state = [], action) {
    switch (action.type) {
        case 'ADD_TICKER':
            const newState = action.newSelectedTicker;
            return newState;
        default:
            return state;
    }
}

function shownTickers(state = [], action) {
    switch (action.type) {
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