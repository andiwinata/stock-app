import React, { PureComponent } from 'react';

import CSSModules from 'react-css-modules';
import styles from './App.css';

class App extends PureComponent {
    render() {
        return (
            <div styleName="full-width">
                Hello World! NONONO
            </div>
        );
    }
}

export default CSSModules(App, styles);