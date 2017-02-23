import React, { PureComponent } from 'react';

import { connect } from 'react-redux';

import TickerSelect from './TickerSelect';
import ShownTickers from './SelectedTickers';

import { addSelectedTicker } from '../actionCreators';

import CSSModules from 'react-css-modules';
import styles from './App.css';

export class App extends PureComponent {
    render() {
        return (
            <div styleName="full-width">
                <h1>Select Tickers:</h1>
                <TickerSelect 
                    onTickerSelectChange={this.props.onTickerSelectChange}
                    selectedTickers={this.props.selectedTickers}
                />
                <hr />
                <ShownTickers 
                    shownTickers={this.props.shownTickers}
                />
            </div>
        );
    }
}

function mapStateToProps(state) {
    return state;
}

function mapDispatchToProps(dispatch) {
    return {
        onTickerSelectChange: (value) => {
            dispatch(addSelectedTicker(value));
        }
    }
}

const AppCSS = CSSModules(App, styles);

export const AppContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AppCSS);