import { AppContainer } from './components/App';

import React from 'react';
import ReactDOM from 'react-dom';

import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import stockAppSaga from './sagas';

import reducer from './reducer';

const initialState = {
    selectedTickers: [],
    shownTickers: []
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