import URI from 'urijs';

/**
 * 
 * 
 * @export
 * @param {String} serverHost
 * @param {Array} tickers
 * @param {String} startDate
 * @param {String} endDate
 * @param {String} apiKey
 * @param {Object} extraParams
 * @returns {String} uri
 */
export function constructRetrieveTickerDataUri(serverHost, tickers, startDate, endDate, apiKey = null, extraParams = null) {
    let uri = new URI(serverHost)
        .setQuery({
            'ticker': tickers.join(','),
            'date.gte': startDate,
            'date.lte': endDate
        })

    // only set api key if not null
    if (apiKey) {
        uri.setQuery('api_key', apiKey);
    }

    if (extraParams) {
        if (extraParams === Object(extraParams) && !Array.isArray(extraParams)) {
            uri.setQuery(extraParams);
        } else {
            console.warn('extra params is not an object!');
        }
    }

    return uri;
}

/**
 * @typedef RequestListObj
 * @property {String[]} dateRange in string format: `${startDate}-${endDate}`
 */

/**
 * Generate RequestListObj from StockDataCacheStatus
 * 
 * @export
 * @param {StockDataCacheStatus} cacheStatuses
 * @returns {RequestListObj} Object containing request list mapped by daterange as key
 */
export function getRequestListObjForCacheStatuses(cacheStatuses) {
    const requestsList = {};

    // construct requestsList
    // grouped by matching start and end date, containing array of tickers
    cacheStatuses.forEach(cacheStatus => {
        cacheStatus.dateGaps.forEach(dateGap => {
            const combinedStartEndDate = `${dateGap.startDate}-${dateGap.endDate}`;

            if (!(combinedStartEndDate in requestsList)) {
                requestsList[combinedStartEndDate] = [];
            }
            requestsList[combinedStartEndDate].push(cacheStatus.ticker);
        });
    });

    return requestsList;
}

/**
 * 
 * 
 * @export
 * @param {String} serverHost
 * @param {StockDataCacheStatus} cacheStatuses
 * @param {String} apiKey
 * @param {Object} extraParams
 * @param {Object} functionDependencies
 * @returns {String[]} Array of URI/URLs
 */
export function getRequestUrisForCacheStatuses(serverHost, cacheStatuses, apiKey = null, extraParams = null, dependenciesInjector = null) {
    // this is not ideal... 
    // this is used for testing purposes
    if (!dependenciesInjector) {
        console.log('NO dependenciesInjector');
        dependenciesInjector = {
            getRequestListObjForCacheStatuses,
            constructRetrieveTickerDataUri
        };
    }

    const requestsList = dependenciesInjector.getRequestListObjForCacheStatuses(cacheStatuses);

    // return constructed request url for every requestLists entry
    return Object.keys(requestsList).map(startEndDate => {
        const [startDate, endDate] = startEndDate.split('-');
        return dependenciesInjector.constructRetrieveTickerDataUri(serverHost, requestsList[startEndDate], startDate, endDate, apiKey, extraParams);
    });
}

export function generateUrisFromCacheStatuses(cacheStatuses, serverHost, apiKey) {
    // group tickerName based on dateGap first
    // e.g. if there are 2 cacheStatuses
    // { tickerName: MSFT, dateGaps: [{startDate: 20170101, endDate: 20170103}, {startDate: 20170107, endDate: 20170110}] }
    // { tickerName: AMZN, dateGaps: [{startDate: 20170101, endDate: 20170103}, {startDate: 20170110, endDate: 20170115}] }
    // it will become
    // { 20170101_20170103: [MSFT, AMZN], 20170107_20170110: [MSFT], 20170110_20170115: [AMZN] }
    // so from that object we can construct the minimum requests needed to get all data
    const tickerNamesGroupedByDateGap = {};
    cacheStatuses.forEach(cacheStatus => {
        cacheStatus.dateGaps.forEach(dateGap => {
            const dateGapKey = `${dateGap.startDate}_${dateGap.endDate}`;
            if (!dateGapKey in tickerNamesGroupedByDateGap) {
                tickerNamesGroupedByDateGap[dateGapKey] = [];
            }

            tickerNamesGroupedByDateGap[dateGapKey].push(cacheStatus.tickerName);
        });
    });

    // generate the uris
    const uris = Object.keys(tickerNamesGroupedByDateGap).map(dateGapString => {
        const [startDate, endDate] = dateGapString.split('_');
        const tickers = tickerNamesGroupedByDateGap[dateGapString];
        return constructRetrieveTickerDataUri(serverHost, tickers, startDate, endDate, apiKey);
    });

    return uris;
}