import React, { PureComponent } from 'react';

class ShownTickers extends PureComponent {
    render() {
        return (
            <div>
                {Object.keys(this.props.shownTickers).map(ticker => 
                    <div key={ticker} className="shownTicker">
                        {ticker}
                    </div>
                )}
            </div>
        );
    }
}

export default ShownTickers;