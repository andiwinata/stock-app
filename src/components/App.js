import React, { PureComponent } from 'react';

import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';

import TickerSelect from './TickerSelect';
import ShownTickers from './ShownTickers';
import DateSelect from './DateSelect';
import StockChart from './StockChart';
import ChartType from './ChartType';

import * as actionCreators from '../actionCreators';

import CSSModules from 'react-css-modules';
import styles from './App.scss';

export class App extends PureComponent {
    render() {
        return (
            <div styleName="app-wrap">
                <Helmet>
                    <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" />
                </Helmet>
                <div styleName="header">
                    <h1>Stock Chart</h1>
                </div>
                <main styleName="app-main">
                    <ChartType
                        chartType={this.props.chartType}
                        chartTypeChanged={this.props.chartTypeChanged}
                    />
                    <ShownTickers
                        shownTickers={this.props.shownTickers}
                    />
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
                    <StockChart
                        chartType={this.props.chartType}
                        shownTickers={this.props.shownTickers}
                        shownDate={this.props.shownDate}
                        // doing deep copy to avoid mutation of stored stock data
                        storedStockData={Object.assign({}, this.props.storedStockData)}
                        shownStockData={this.props.shownStockData}
                    />
                </main>
            </div>
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