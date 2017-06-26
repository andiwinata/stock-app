import React, { PureComponent } from 'react';

import VirtualizedSelect from 'react-virtualized-select';
import createFilterOptions from 'react-select-fast-filter-options';
import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css';
import 'react-virtualized-select/styles.css';

import styles from './TickerSelect.scss';

var options = require('../data/ticker_abbrvlong_abbrv_list.json');
var filterOptions = createFilterOptions({ options });

class TickerSelect extends PureComponent {
    render() {
        return (
            <div>
                <div className={styles.tickerSelectContainer}>
                    <VirtualizedSelect
                        autoBlur={true}
                        clearable={false}
                        className={styles.tickerSelect}
                        name="form-field-name"
                        // right now just use one ticker
                        value={this.props.selectedTickers[0]}
                        filterOptions={filterOptions}
                        options={options}
                        onChange={this.props.selectedTickerChanged}
                        placeholder='Select ticker...'
                    />
                </div>
            </div>
        );
    }
}

export default TickerSelect;