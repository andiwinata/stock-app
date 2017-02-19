import { combineReducers } from 'redux';

const initialState = {
    selectedTickers: [],
    shownTickers: []
}

function selectedTickers(state = initialState, action) {
    switch (action.type) {
        case 'ADD_TICKER':
            console.log(action);
            console.log('reducer', action, 'state', state, 'newticker', action.newSelectedTicker);
            const newState = [...state.selectedTickers, action.newSelectedTicker];
            console.log('newstate', newState);
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