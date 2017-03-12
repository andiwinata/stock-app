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
export function constructRetrieveTickerDataUri(serverHost, tickers, startDate, endDate, apiKey, extraParams) {
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
        if (extraParams === Object(extraParams)) {
            uri.setQuery(extraParams);
        } else {
            console.warn('extra params is not an object!');
        }
    }

    return uri;
}

/**
 * 
 * 
 * @export
 * @param {String} serverHost
 * @param {StockDataCacheStatus} cacheStatuses
 * @param {String} apiKey
 * @param {Object} extraParams
 * @returns {String[]} Array of URI/URLs
 */
export function getRequestUrisForCacheStatuses(serverHost, cacheStatuses, apiKey, extraParams) {
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

    console.log("REQUESTS LIST", requestsList);

    // return constructed request url for every requestLists entry
    return Object.keys(requestsList).map(startEndDate => {
        const [startDate, endDate] = startEndDate.split('-');
        return constructRetrieveTickerDataUri(serverHost, requestsList[startEndDate], startDate, endDate, apiKey, extraParams);
    });
}