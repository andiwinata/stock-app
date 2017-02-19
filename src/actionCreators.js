/**
 * action types const
 */
export const ADD_TICKER = 'ADD_TICKER';

export function addSelectedTicker(newSelectedTicker) {
    return {
        type: ADD_TICKER,
        newSelectedTicker
    }
}
