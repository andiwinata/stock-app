import React, { PureComponent } from 'react';

class ShownTickers extends PureComponent {
    render() {
        return (
            <div>
                {this.props.shownTickers.map(ticker => 
                    <div key={Date.now() + Math.random()} className="shownTicker">
                        {ticker}
                    </div>
                )}
            </div>
        );
    }
}

export default ShownTickers;