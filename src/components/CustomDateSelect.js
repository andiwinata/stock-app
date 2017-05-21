import React, { PureComponent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

class CustomDateSelect extends PureComponent {
    customDateChanged = (datePropertyName) => (val) => {
        const changedDateObj = {[datePropertyName]: val};
        const dateRange = Object.assign({}, this.props.selectedDate, changedDateObj);
        this.props.selectedDateChanged(dateRange);
    }

    render() {
        return (
            <div>
                <DatePicker
                    dateFormat="DD-MMM-YYYY"
                    selected={this.props.selectedDate.startDate}
                    selectsStart
                    startDate={this.props.selectedDate.startDate}
                    endDate={this.props.selectedDate.endDate}
                    onChange={this.customDateChanged('startDate')}
                />
                <DatePicker
                    dateFormat="DD-MMM-YYYY"
                    selected={this.props.selectedDate.endDate}
                    selectsEnd
                    startDate={this.props.selectedDate.startDate}
                    endDate={this.props.selectedDate.endDate}
                    onChange={this.customDateChanged('endDate')}
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