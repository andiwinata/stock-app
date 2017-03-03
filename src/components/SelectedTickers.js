import React, { PureComponent } from 'react';

class ShownTickers extends PureComponent {
    render() {
        console.log('render shown tickers', this.props.shownTickers);

        return (
            <div>
                {Object.keys(this.props.shownTickers).map(ticker => 
                    <div key={Date.now() + Math.random()} className="shownTicker">
                        {JSON.stringify(this.props.shownTickers.ticker, null, 4)}
                    </div>
                )}
            </div>
        );
    }
}

export default ShownTickers;