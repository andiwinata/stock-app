import React, { PureComponent } from 'react';
import CustomDateSelect from './CustomDateSelect';

class DateSelect extends PureComponent {
    render() {
        return (
            <div>
                <button>1y</button>
                <button>6m</button>
                <button>3m</button>
                <CustomDateSelect />
            </div>
        );
    }
}

export default DateSelect;