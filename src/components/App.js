import React, { PureComponent } from 'react';

import TickerSelect from'./TickerSelect';

import CSSModules from 'react-css-modules';
import styles from './App.css';


class App extends PureComponent {
    render() {
        return (
            <div styleName="full-width">
                Hello World! NONONO
                <TickerSelect />
            </div>
        );
    }
}

export default CSSModules(App, styles);