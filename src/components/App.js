import React, { PureComponent } from 'react';

import { connect } from 'react-redux';

import TickerSelect from './TickerSelect';
import ShownTickers from './ShownTickers';
import DateSelect from './DateSelect';
import StockChart from './StockChart';

import * as actionCreators from '../actionCreators';

import CSSModules from 'react-css-modules';
import styles from './App.scss';

export class App extends PureComponent {
    render() {
        return (
            <main styleName="app-main">
                <div styleName="header">
                    <h1>Stock Chart</h1>
                </div>
                <div styleName="controller-container">
                    <DateSelect
                        selectedDateChanged={this.props.selectedDateChanged}
                        selectedDate={this.props.selectedDate}
                    />
                    <TickerSelect
                        selectedTickerChanged={this.props.selectedTickerChanged}
                        selectedTickers={this.props.selectedTickers}
                    />
                </div>
                <ShownTickers
                    shownTickers={this.props.shownTickers}
                />
                <StockChart
                    shownTickers={this.props.shownTickers}
                    shownDate={this.props.shownDate}
                    // doing deep copy to avoid mutation of stored stock data
                    storedStockData={Object.assign({}, this.props.storedStockData)}
                    shownStockData={this.props.shownStockData}
                />
            </main>
        );
    }
}

function mapStateToProps(state) {
    return state;
}

const AppCSS = CSSModules(App, styles, { allowMultiple: true });

export const AppContainer = connect(
    mapStateToProps,
    actionCreators
)(AppCSS);