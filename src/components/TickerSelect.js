import React, { PureComponent } from 'react';

import VirtualizedSelect from 'react-virtualized-select';
import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css'
import 'react-virtualized-select/styles.css'
import createFilterOptions from 'react-select-fast-filter-options';

function logChange(val) {
    console.log("Selected: " + val);
}

var options = require('../data/ticker_list.json');
var filterOptions = createFilterOptions({ options });

class TickerSelect extends PureComponent {
    render() {
        return (
            <div>
                <VirtualizedSelect
                    name="form-field-name"
                    value="one"
                    filterOptions={filterOptions}
                    options={options}
                    onChange={logChange}
                />
            </div>
        );
    }
}

export default TickerSelect;