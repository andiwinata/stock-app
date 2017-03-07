import { AppContainer } from './components/App';

import React from 'react';
import ReactDOM from 'react-dom';

import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import stockAppSaga from './sagas';

import reducer from './reducer';
import initialState from './initialState';

const IS_PROD = false;

const sagaMiddleware = createSagaMiddleware()

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = IS_PROD ?
    createStore(reducer,
        initialState,
        applyMiddleware(sagaMiddleware)) :
    createStore(reducer,
        initialState,
        composeEnhancers(applyMiddleware(sagaMiddleware))
    );

sagaMiddleware.run(stockAppSaga)

ReactDOM.render(
    <Provider store={store}>
        <AppContainer />
    </Provider>,
    document.getElementById('app')
);