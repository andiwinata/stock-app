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
            if (!(dateGapKey in tickerNamesGroupedByDateGap)) {
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