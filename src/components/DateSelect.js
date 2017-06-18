import React, { PureComponent } from 'react';
import CustomDateSelect from './CustomDateSelect';
import moment from 'moment';
import Button from './Button';
import classNames from 'classnames';

const now = moment().startOf('day');

const diffIdMap = {
    [moment.duration(1, 'week').asMilliseconds()]: '1weeks',
    [moment.duration(1, 'month').asMilliseconds()]: '1months',
    [moment.duration(3, 'month').asMilliseconds()]: '3months',
    [moment.duration(6, 'month').asMilliseconds()]: '6months',
    [moment.duration(1, 'year').asMilliseconds()]: '1years',
};

class DateSelect extends PureComponent {
    constructor(props) {
        super(props);
        // calculate the current selectedDateRange and try to compare with predefined button
        const dateGapInMs = moment(props.selectedDate.endDate).diff(props.selectedDate.startDate);
        const initialSelectedDuration = dateGapInMs in diffIdMap ? diffIdMap[dateGapInMs] : 'custom';

        this.state = {
            selectedDuration: initialSelectedDuration,
        };
    }

    // todo memoize using react select?
    predefinedDateChanged = (subtractAmount, subtractUnit) => {
        const dateObject = {
            startDate: moment(now).subtract(subtractAmount, subtractUnit),
            endDate: now
        };

        this.props.selectedDateChanged(dateObject);
    }

    predefinedButtonClicked = (subtractAmount, substractUnit) => () => {
        // this setState will not cause this component to re-rendered twice.
        // after calling this.props.seletedDateChanged, it seems they are batched together
        this.setState({
            selectedDuration: subtractAmount + substractUnit,
        });
        this.predefinedDateChanged(subtractAmount, substractUnit);
    }

    generatePredefinedButtonClassName = (identifier) => {
        return classNames({
            'btn--line': true,
            'is-active': identifier === this.state.selectedDuration,
        });
    }

    customDateSelected = () => {
        this.setState({
            selectedDuration: 'custom',
        });
    }

    render() {
        return (
            <div>
                <Button
                    className={this.generatePredefinedButtonClassName('1weeks')}
                    onClick={this.predefinedButtonClicked(1, 'weeks')}
                    text={'1w'}
                />
                <Button
                    className={this.generatePredefinedButtonClassName('1months')}
                    onClick={this.predefinedButtonClicked(1, 'months')}
                    text={'1m'}
                />
                <Button
                    className={this.generatePredefinedButtonClassName('3months')}
                    onClick={this.predefinedButtonClicked(3, 'months')}
                    text={'3m'}
                />
                <Button
                    className={this.generatePredefinedButtonClassName('6months')}
                    onClick={this.predefinedButtonClicked(6, 'months')}
                    text={'6m'}
                />
                <Button
                    className={this.generatePredefinedButtonClassName('1years')}
                    onClick={this.predefinedButtonClicked(1, 'years')}
                    text={'1y'}
                />
                <CustomDateSelect
                    {...this.props}
                    customDateSelected={this.customDateSelected}
                />
            </div>
        );
    }
}

export default DateSelect;