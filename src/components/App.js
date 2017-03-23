import React, { PureComponent } from 'react';

import { connect } from 'react-redux';

import TickerSelect from './TickerSelect';
import ShownTickers from './ShownTickers';
import DateSelect from './DateSelect';
import StockChart from './StockChart';

import * as actionCreators from '../actionCreators';

import CSSModules from 'react-css-modules';
import styles from './App.css';

export class App extends PureComponent {
    render() {
        return (
            <div styleName="full-width">
                <h1>Select Tickers:</h1>
                <TickerSelect
                    selectedTickerChanged={this.props.selectedTickerChanged}
                    selectedTickers={this.props.selectedTickers}
                />
                <hr />
                <DateSelect
                    selectedDateChanged={this.props.selectedDateChanged}
                    selectedDate={this.props.selectedDate}
                />
                <ShownTickers
                    shownTickers={this.props.shownTickers}
                />
                <StockChart
                    shownTickers={this.props.shownTickers}
                    shownDate={this.props.shownDate}
                    // doing deep copy to avoid mutation of stored stock data
                    storedStockData={Object.assign({}, this.props.storedStockData)}
                />
            </div>
        );
    }
}

function mapStateToProps(state) {
    return state;
}

const AppCSS = CSSModules(App, styles);

export const AppContainer = connect(
    mapStateToProps,
    actionCreators
)(AppCSS);