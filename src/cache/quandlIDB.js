import createStockIDB, {
    applyMiddleware, defaultConfig, stockIDBDateFormat,
    CACHE_AVAILABILITY, stockDataComparerDate, cacheStatusFactory, dateGapFactory
} from './stockIDB';
import moment from 'moment';

export { CACHE_AVAILABILITY, stockDataComparerDate, cacheStatusFactory, dateGapFactory };

/**
 * Sort stockData by ticker and date
 * with ticker as precedence 
 * https://stackoverflow.com/questions/6129952/javascript-sort-array-by-two-fields
 * 
 * @param {any} stockData 
 * @param {any} stockData
 * @returns {Number}
 */
export function stockDataComparerTickerDate(a, b) {
    const tickerA = a.ticker.toLowerCase();
    const tickerB = b.ticker.toLowerCase();

    const tickerComparison = tickerA < tickerB ? -1 : tickerA > tickerB ? 1 : 0;
    return tickerComparison || moment(a.date).diff(b.date, 'days');
};

export default function createQuandlIDB(overrider) {
    let quandlIDBInstance = null;

    function _init() {

        // make custom config, even though now it is just the same as default config
        const quandlIDBConfig = Object.assign({}, defaultConfig);

        const createEmptyTickerData = (ticker, date) => {
            return {
                ticker,
                date,
                empty: true
            };
        };

        const isNotEmptyTickerData = tickerData => !tickerData.empty;

        /**
         * Trying to fill in dateGaps from tickerData, based on startDate and endDate
         * fill empty tickerData on corresponding date with -1 value
         * 
         * 
         * @param {*} next 
         */
        const putTickerDataMiddleware = (next) => (tickerData, startDate, endDate) => { // DATE FORMAT TO REFACTOR USING CONFIG OBJECT!
            if (!Array.isArray(tickerData)) {
                return next(tickerData);
            } else if (tickerData.length === 1) {
                return next(tickerData);
            }

            console.log('getting into put middleware');
            const dateFormat = stockIDBDateFormat;

            // sort first
            tickerData.sort(stockDataComparerTickerDate);

            // if there is no startDate or endDate, assume the first and last both are start and end date
            startDate = startDate || tickerData[0].date;
            endDate = endDate || tickerData[tickerData.length - 1].date;

            // strip off time (can be moment obj or string)
            startDate = moment(startDate).startOf('day');
            endDate = moment(endDate).startOf('day');

            const filledTickerData = [];

            /**
             * Populating filledTickerData which is an array containing tickerData +
             * emptyData for any missing data in the dateRange (startDate until endDate)
             * 
             * @param {*} currentTickerName filling data for which ticker name
             * @param {*} tickerDataIndex filling data starting from which index of tickerData
             */
            const populateFilledTickerData = (currentTickerName, tickerDataIndex) => {
                let currentTickerData;

                // iterate through startDate and endDate (inclusive)
                // http://stackoverflow.com/questions/17163809/iterate-through-a-range-of-dates-in-nodejs
                for (let currDate = moment(startDate); currDate.diff(endDate, 'days') <= 0; currDate.add(1, 'day')) {
                    currentTickerData = tickerData[tickerDataIndex];

                    // if the index surpass length of the tickerData,
                    // or if the next data is different from the current ticker
                    // just fill currentDate with empty data until we finish the loop
                    if (!currentTickerData || currentTickerData.ticker !== currentTickerName) {
                        filledTickerData.push(
                            createEmptyTickerData(currentTickerName, currDate.format(dateFormat))
                        );
                        continue;
                    }

                    const dateDiffWithCurrentTickerData = currDate.diff(currentTickerData.date, 'day');

                    if (dateDiffWithCurrentTickerData === 0) {
                        filledTickerData.push(currentTickerData);
                        tickerDataIndex++;
                    } else if (dateDiffWithCurrentTickerData > 0) {
                        // if current ticker data is earlier than currDate, something wrong
                        throw new Error('tickerData must be sorted!')
                    } else {
                        // current tickerData.date jumps from previous date, so there is a gap
                        // fill it with empty data until the date sync up again
                        filledTickerData.push(
                            createEmptyTickerData(currentTickerName, currDate.format(dateFormat))
                        );
                    }
                }

                // if after finishing loop, there is still next data
                // and the next data has different ticker name
                // loop from beginning again for next ticker, starting from next data
                if (currentTickerData && currentTickerData.ticker !== currentTickerName) {
                    populateFilledTickerData(currentTickerData.ticker, tickerDataIndex);
                }
            };

            // set the first tickerName
            const tickerName = tickerData[0].ticker;
            // then populate first tickerName
            populateFilledTickerData(tickerName, 0);

            // pass the filledTickerData to next function
            return next(filledTickerData);
        };

        const getCachedTickerDataMiddleware = (next) => (tickerName, fromDate, toDate) => {
            return next(tickerName, fromDate, toDate)
                .then(cachedTickerData => {
                    // remove empty data inserted by putTickerDataMiddleware
                    cachedTickerData.cacheData = cachedTickerData.cacheData.filter(isNotEmptyTickerData);
                    return cachedTickerData;
                });
        };

        const overrider = applyMiddleware([
            {
                functionName: 'putTickerData',
                middlewares: putTickerDataMiddleware
            },
            {
                functionName: 'getCachedTickerData',
                middlewares: getCachedTickerDataMiddleware
            }
        ]);

        quandlIDBInstance = createStockIDB(overrider, quandlIDBConfig);
    };

    _init();

    if (overrider) {
        return overrider(quandlIDBInstance);
    }

    return quandlIDBInstance;
};
