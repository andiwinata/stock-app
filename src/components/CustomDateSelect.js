import React, { PureComponent } from 'react';
import DatePicker from 'react-datepicker';
import Button from './Button';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import styles from './CustomDateSelect.scss';

class CustomDateSelect extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            selectedDate: Object.assign({}, props.selectedDate),
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState(
            Object.assign(this.state.selectedDate, nextProps.selectedDate),
        );
    }

    customDateChanged = (datePropertyName) => (val) => {
        this.setState(
            Object.assign(this.state.selectedDate, { [datePropertyName]: val }),
        );
    };

    applyButtonClicked = () => {
        // change the highlight
        this.props.customDateSelected();
        // call the store function
        this.props.selectedDateChanged(Object.assign({}, this.state.selectedDate));
    };

    cancelButtonClicked = () => {
        this.setState(
            Object.assign(this.state.selectedDate, this.props.selectedDate),
        );
    };

    render() {
        return (
            <div className={styles.customDateContainer}>
                <DatePicker
                    className={styles.datePicker}
                    dateFormat="DD-MMM-YYYY"
                    selected={this.state.selectedDate.startDate}
                    selectsStart
                    startDate={this.state.selectedDate.startDate}
                    endDate={this.state.selectedDate.endDate}
                    onChange={this.customDateChanged('startDate')}
                />
                <span className={styles.betweenDate}>to</span>
                <DatePicker
                    className={styles.datePicker}
                    dateFormat="DD-MMM-YYYY"
                    selected={this.state.selectedDate.endDate}
                    selectsEnd
                    startDate={this.state.selectedDate.startDate}
                    endDate={this.state.selectedDate.endDate}
                    onChange={this.customDateChanged('endDate')}
                />
                <div className={styles.buttonsContainer}>
                    <Button
                        className={['btn', styles.buttonCancel]}
                        text='Cancel'
                        onClick={this.cancelButtonClicked}
                    />
                    <Button
                        className={['btn', styles.buttonApply]}
                        text='Apply'
                        onClick={this.applyButtonClicked}
                    />
                </div>
            </div>
        );
    }
}

export default CustomDateSelect;