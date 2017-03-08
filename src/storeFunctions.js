import moment from 'moment';

/**
 * Checking whether for the passed stock data has been cached in storedData
 * 
 * @export
 * @param {any} storedData
 * @param {any} startDate
 * @param {any} endDate
 * @param {any} ticker
 */
export function isTickerCached(storedData, startDate, endDate, ticker) {
    if (typeof ticker !== 'string' || !(ticker instanceof String)) {
        throw new Error('Ticker must be string');
    }

    if (!moment.isMoment(startDate)) {
        startDate = moment(startDate);
    }

    if (!moment.isMoment(endDate)) {
        endDate = moment(endDate);
    }

    if (!(ticker in storedData)) {
        return false;
    }

    const storedTickerData = storedData[ticker];
    if (!('startDate' in storedData && 'endDate' in storedData)) {
        throw new Error('startDate and endDate must be in stored data');
    }
    // TODO don't just return true or false but also calculate which date are missing

    // start date is earlier than stored ticker data start date
    if (startDate.isBefore(storedTickerData.startDate)) {
        return false;
    }

    if (endDate.isAfter(storedTickerData.endDate)) {
        return false;
    }

    return true;
}