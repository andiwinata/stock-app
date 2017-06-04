import React, { PureComponent } from 'react';
import CustomDateSelect from './CustomDateSelect';
import moment from 'moment';

const now = moment();

class DateSelect extends PureComponent {
    // todo memoize using react select?
    predefinedDateChanged = (substractAmount, substractUnit) => () => {
        const dateObject = {
            startDate: moment().subtract(substractAmount, substractUnit),
            endDate: now
        };

        this.props.selectedDateChanged(dateObject);
    }

    render() {
        return (
            <div>
                <button className='btn--line' onClick={this.predefinedDateChanged(1, 'years')}>1y</button>
                <button className='btn--line' onClick={this.predefinedDateChanged(6, 'months')}>6m</button>
                <button className='btn--line' onClick={this.predefinedDateChanged(3, 'months')}>3m</button>
                <CustomDateSelect
                    {...this.props}
                />
            </div>
        );
    }
}

export default DateSelect;