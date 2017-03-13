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
 * @typedef {Object} CheckTickerCachedResult
 * @property {String} ticker
 * @property {CACHE_AVAILABILITY} cacheAvailability
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
 * @returns {StockDataCacheStatus} Result
 */
export function determineCachedStockDataStatus(storedData, startDate, endDate, ticker) {
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
            startDate: startDate.format('YYYYMMDD'),
            endDate: endDate.format('YYYYMMDD')
        });
        resultObj.cacheAvailability = CACHE_AVAILABILITY.NONE;
        return resultObj;
    }

    const storedTickerData = storedData[ticker];
    console.log("STORED DATA", storedTickerData, storedTickerData.startDate);
    if (!('startDate' in storedTickerData && 'endDate' in storedTickerData)) {
        throw new Error('startDate and endDate must be in storedTickerData');
    }

    // start date is earlier than stored ticker data start date
    const requestStartDateEarlierThanCache = startDate.isBefore(storedTickerData.startDate, 'day');
    // end date is later than stored ticker data end date
    const requestEndDateLaterThanCache = endDate.isAfter(storedTickerData.endDate, 'day');

    console.log("REQUEST EARLIER, LATER", startDate.format('YYYYMMDD'), storedTickerData.startDate, endDate.format('YYYYMMDD'),  storedTickerData.endDate);
    console.log(requestStartDateEarlierThanCache, requestEndDateLaterThanCache);

    if (requestStartDateEarlierThanCache) {
        // add gap from startDate to storedTickerData.startDate
        resultObj.dateGaps.push({
            startDate: startDate.format('YYYYMMDD'),
            endDate: moment(storedTickerData.startDate).subtract(1, 'days').format('YYYYMMDD')
        });
    }

    if (requestEndDateLaterThanCache) {
        // add gap from storedTickerData.endDate to endDate
        resultObj.dateGaps.push({
            startDate: moment(storedTickerData.endDate).add(1, 'days').format('YYYYMMDD'),
            endDate: endDate.format('YYYYMMDD')
        });
    }

    // if some cache data exist, but the requested one has wider DateRange
    if (requestStartDateEarlierThanCache || requestEndDateLaterThanCache) {
        // then set partiallyCached to true
        resultObj.cacheAvailability = CACHE_AVAILABILITY.PARTIAL;
    }

    return resultObj;
}