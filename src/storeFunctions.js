import moment from 'moment';

/**
 * @typedef {Object} DateRange
 * @property {startDate} String
 * @property {endDate} String
 */

/**
 * @typedef {Object} CheckTickerCachedResult
 * @property {Boolean} needToMakeRequest
 * @property {Boolean} partiallyCached
 * @property {DateRange[]} dateGaps
 */

/**
 * Checking whether for the passed stock data has been cached in storedData
 * 
 * @export
 * @param {any} storedData
 * @param {any} startDate
 * @param {any} endDate
 * @param {any} ticker
 * @returns {CheckTickerCachedResult} Result
 */
export function determineCachedStockDataStatus(storedData, startDate, endDate, ticker) {
    if (typeof ticker !== 'string' || !(ticker instanceof String)) {
        throw new Error('Ticker must be string');
    }

    if (!moment.isMoment(startDate)) {
        startDate = moment(startDate);
    }

    if (!moment.isMoment(endDate)) {
        endDate = moment(endDate);
    }

    const resultObj = {
        needToMakeRequest: false,
        partiallyCached: false,
        dateGaps: [],
    };

    // cache not available
    if (!(ticker in storedData)) {
        resultObj.dateGaps.push({
            startDate: startDate.format('YYYYMMDD'),
            endDate: endDate.format('YYYYMMDD')
        });
        resultObj.needToMakeRequest = true;
        return resultObj;
    }

    const storedTickerData = storedData[ticker];
    if (!('startDate' in storedData && 'endDate' in storedData)) {
        throw new Error('startDate and endDate must be in stored data');
    }

    // start date is earlier than stored ticker data start date
    const requestStartDateEarlierThanCache = startDate.isBefore(storedTickerData.startDate);
    // end date is later than stored ticker data end date
    const requestEndDateLaterThanCache = endDate.isAfter(storedTickerData.endDate);

    if (requestStartDateEarlierThanCache) {
        // add gap from startDate to storedTickerData.startDate
        resultObj.dateGaps.push({
            startDate: startDate.format('YYYYMMDD'),
            endDate: storedTickerData.startDate.substract(1, 'days').format('YYYYMMDD')
        });
    }

    if (requestEndDateLaterThanCache) {
        // add gap from storedTickerData.endDate to endDate
        resultObj.dateGaps.push({
            startDate: storedTickerData.endDate.add(1, 'days').format('YYYYMMDD'),
            endDate: endDate.format('YYYYMMDD')
        });
    }

    // if some cache data exist, but the requested one has wider DateRange
    if (requestStartDateEarlierThanCache || requestEndDateLaterThanCache) {
        // then set partiallyCached to true, also it still need to make request
        resultObj.needToMakeRequest = true;
        resultObj.partiallyCached = true;
    }

    return resultObj;
}