import { AppContainer } from './components/App';

import React from 'react';
import ReactDOM from 'react-dom';

import { createStore, applyMiddleware } from 'redux';

import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';

import reducer from './reducer';

import middleware from './middleware';

const initialState = {
    selectedTickers: [],
    shownTickers: []
}

const store = createStore(reducer,
    initialState,
    applyMiddleware(middleware)
);

ReactDOM.render(
    <Provider store={store}>
        <AppContainer />
    </Provider>,
    document.getElementById('app')
);