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