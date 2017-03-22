import moment from 'moment';

export const CACHE_AVAILABILITY = {
    FULL: 'FULL',
    PARTIAL: 'PARTIAL',
    NONE: 'NONE'
}

/**
 * @typedef {Object} DateRange
 * @property {startDate} String
 * @property {endDate} String
 */

/**
 * @typedef {Object} StockDataCacheStatus
 * @property {String} ticker
 * @property {CACHE_AVAILABILITY} cacheAvailability
 * @property {DateRange[]} dateGaps
 */

/**
 * Checking whether for the passed stock data has been cached in storedData
 * 
 * @export
 * @param {Object} storedData
 * @param {String|Moment} startDate
 * @param {String|Moment} endDate
 * @param {String} ticker
 * @param {String} dateFormat
 * @returns {StockDataCacheStatus} Result
 */
export function determineCachedStockDataStatus(storedData, startDate, endDate, ticker, dateFormat = 'YYYYMMDD') {
    if (typeof ticker !== 'string' && !(ticker instanceof String)) {
        throw new Error('Ticker must be string');
    }

    if (!moment.isMoment(startDate)) {
        startDate = moment(startDate);
    }

    if (!moment.isMoment(endDate)) {
        endDate = moment(endDate);
    }

    const resultObj = {
        ticker: ticker,
        cacheAvailability: CACHE_AVAILABILITY.FULL,
        dateGaps: [],
    };

    // cache not available
    if (!(ticker in storedData)) {
        resultObj.dateGaps.push({
            startDate: startDate.format(dateFormat),
            endDate: endDate.format(dateFormat)
        });
        resultObj.cacheAvailability = CACHE_AVAILABILITY.NONE;
        return resultObj;
    }

    const storedTickerData = storedData[ticker];
    if (!('startDate' in storedTickerData && 'endDate' in storedTickerData)) {
        throw new Error('startDate and endDate must be in storedTickerData');
    }

    // start date is earlier than stored ticker data start date
    const requestStartDateEarlierThanCache = startDate.isBefore(storedTickerData.startDate, 'day');
    // end date is earlier than stored ticker data start date
    const requestEndDateEarlierThanCache = endDate.isBefore(storedTickerData.startDate, 'day');

    // end date is later than stored ticker data end date
    const requestEndDateLaterThanCache = endDate.isAfter(storedTickerData.endDate, 'day');
    // start date is later than stored ticker data end date
    const requestStartDateLaterThanCache = startDate.isAfter(storedTickerData.endDate, 'day');

    if (requestStartDateEarlierThanCache) {
        // add gap from startDate to storedTickerData.startDate
        resultObj.dateGaps.push({
            startDate: startDate.format(dateFormat),
            endDate: moment(storedTickerData.startDate).subtract(1, 'days').format(dateFormat)
        });
    }

    if (requestEndDateLaterThanCache) {
        // add gap from storedTickerData.endDate to endDate
        resultObj.dateGaps.push({
            startDate: moment(storedTickerData.endDate).add(1, 'days').format(dateFormat),
            endDate: endDate.format(dateFormat)
        });
    }

    // if the requested date range is way earlier or later than stored daterange, mark it as non-cached
    if ((requestStartDateEarlierThanCache && requestEndDateEarlierThanCache) ||
        (requestStartDateLaterThanCache && requestEndDateLaterThanCache)) {
        // then set cache status to none
        resultObj.cacheAvailability = CACHE_AVAILABILITY.NONE;

    } else if (!requestStartDateEarlierThanCache && !requestEndDateLaterThanCache) {
        // if the requested daterange is actually inside stored daterange, mark as fully cached
        resultObj.cacheAvailability = CACHE_AVAILABILITY.FULL;

    } else { // otherwise it is partially cached
        // then set cache status to partial
        resultObj.cacheAvailability = CACHE_AVAILABILITY.PARTIAL;
    }

    return resultObj;
}