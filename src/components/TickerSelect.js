import React, { PureComponent } from 'react';

import VirtualizedSelect from 'react-virtualized-select';
import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css'
import 'react-virtualized-select/styles.css'
import createFilterOptions from 'react-select-fast-filter-options';

var options = require('../data/ticker_abbrvlong_abbrv_list.json');
var filterOptions = createFilterOptions({ options });

class TickerSelect extends PureComponent {
    constructor(props) {
        super(props);
        this.logChange = this.logChange.bind(this);
    }

    logChange(val) {
        console.log(this.props, "value", val);
        this.props.onTickerSelectChange(val[0].value);
    }

    render() {
        return (
            <div>
                <VirtualizedSelect
                    name="form-field-name"
                    value={this.props.selectedTickers}
                    multi={true}
                    filterOptions={filterOptions}
                    options={options}
                    onChange={this.logChange}
                />
            </div>
        );
    }
}

export default TickerSelect;