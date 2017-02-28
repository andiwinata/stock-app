import { AppContainer } from './components/App';

import React from 'react';
import ReactDOM from 'react-dom';

import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import stockAppSaga from './sagas';

import reducer from './reducer';

const isLocal = location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname.startsWith('file:///');

const serverHost = isLocal ?
    "http://localhost:3000" : "http://tobehosted.somewhere";

const initialState = {
    selectedTickers: [],
    shownTickers: [],
    apiKey: null, // to be passed to server if not null
    serverHost
}

const sagaMiddleware = createSagaMiddleware()

const store = createStore(reducer,
    initialState,
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(stockAppSaga)

ReactDOM.render(
    <Provider store={store}>
        <AppContainer />
    </Provider>,
    document.getElementById('app')
);