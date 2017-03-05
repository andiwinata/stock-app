import React, { PureComponent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

class CustomDateSelect extends PureComponent {
    render() {
        return (
            <div>
                <DatePicker
                    selected={moment()}
                    selectsStart
                    startDate={moment(new Date(2017, 2, 1))}
                    endDate={moment(new Date(2017, 2, 15))}
                    onChange={(val) => console.log('datechanged', val)}
                />
                <DatePicker
                    selected={moment()}
                    selectsEnd
                    startDate={moment(new Date(2017, 2, 1))}
                    endDate={moment(new Date(2017, 2, 15))}
                    onChange={(val) => console.log('datechanged', val)}
                />
                <div>
                    <button>Cancel</button>
                    <button>Apply</button>
                </div>
            </div>
        );
    }
}

export default CustomDateSelect;