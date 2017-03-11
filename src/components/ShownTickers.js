import React, { PureComponent } from 'react';

class ShownTickers extends PureComponent {
    render() {
        return (
            <div>
                {this.props.shownTickers.map(ticker => 
                    <div key={ticker.value} className="shownTicker">
                        {ticker.label}
                    </div>
                )}
            </div>
        );
    }
}

export default ShownTickers;