import { AppContainer } from './components/App';
import initialState from './initialState';

import React from 'react';
import ReactDOM from 'react-dom';

import { createStore, applyMiddleware } from 'redux';

import { Provider } from 'react-redux';

import reducer from './reducer';

const store = createStore(reducer, initialState);

ReactDOM.render(
    <Provider store={store}>
        <AppContainer />
    </Provider>,
    document.getElementById('app')
);