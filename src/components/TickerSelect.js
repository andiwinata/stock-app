import React, { PureComponent } from 'react';

import VirtualizedSelect from 'react-virtualized-select';
import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css'
import 'react-virtualized-select/styles.css'
import createFilterOptions from 'react-select-fast-filter-options';

var options = require('../data/ticker_abbrvlong_abbrv_list.json');
var filterOptions = createFilterOptions({ options });

class TickerSelect extends PureComponent {
    render() {
        return (
            <div>
                <VirtualizedSelect
                    name="form-field-name"
                    // right now just use one ticker
                    value={this.props.selectedTickers[0]}
                    filterOptions={filterOptions}
                    options={options}
                    onChange={this.props.selectedTickerChanged}
                />
            </div>
        );
    }
}

export default TickerSelect;