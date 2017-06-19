import React, { PureComponent } from 'react';

import VirtualizedSelect from 'react-virtualized-select';
import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css'
import 'react-virtualized-select/styles.css'

export const CHART_TYPES = {
    AREA: 'area',
    CANDLESTICK: 'candlestick',
    LINE: 'line',
    OHLC: 'ohlc',
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const options = Object.keys(CHART_TYPES).map((chartType) => {
    return {
        label: capitalizeFirstLetter(CHART_TYPES[chartType]),
        value: CHART_TYPES[chartType],
    }
});

class ChartType extends PureComponent {
    chartTypeSelectChanged = (val) => this.props.chartTypeChanged(val.value);

    render() {
        return (
            <div>
                <VirtualizedSelect
                    autoBlur={true}
                    clearable={false}
                    name="chart-type-form"
                    value={this.props.chartType}
                    filterOptions={{ options }}
                    options={options}
                    onChange={this.chartTypeSelectChanged}
                />
            </div>
        );
    }
}

export default ChartType;