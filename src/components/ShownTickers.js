import React, { PureComponent } from 'react';
import styles from './ShownTickers.scss';
import CSSModules from 'react-css-modules';

class ShownTickers extends PureComponent {
    render() {
        return (
            <div className={styles.wrapper}>
                {this.props.shownTickers.map(ticker => 
                    <div key={ticker.value} className="shownTicker">
                        {ticker.label}
                    </div>
                )}
            </div>
        );
    }
}

export default CSSModules(ShownTickers, styles);