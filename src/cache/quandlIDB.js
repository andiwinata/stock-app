import createStockIDB, {
    applyMiddleware, defaultConfig, stockIDBDateFormat,
    CACHE_AVAILABILITY, stockDataComparer, cacheStatusFactory, dateGapFactory
} from './stockIDB';
import moment from 'moment';

export { CACHE_AVAILABILITY, stockDataComparer, cacheStatusFactory, dateGapFactory };

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
            tickerData.sort(stockDataComparer);

            // if there is no startDate or endDate, assume the first and last both are start and end date
            startDate = startDate || tickerData[0].date;
            endDate = endDate || tickerData[tickerData.length - 1].date;

            // strip off time (can be moment obj or string)
            startDate = moment(startDate).startOf('day');
            endDate = moment(endDate).startOf('day');

            let currentTickerDataId = 0;
            const filledTickerData = [];

            // set the default tickerName to do validation checking later on
            const tickerName = tickerData[0].ticker;

            // iterate through startDate and endDate (inclusive)
            // http://stackoverflow.com/questions/17163809/iterate-through-a-range-of-dates-in-nodejs
            for (let currDate = moment(startDate); currDate.diff(endDate, 'days') <= 0; currDate.add(1, 'day')) {
                const currentTickerData = tickerData[currentTickerDataId];

                console.log('currdate', currDate.format(dateFormat), 'tickerdate', currentTickerData ? currentTickerData.date : 'NO TICKER DATA');
                // if the index surpass length of the tickerData, just fill currentDate with empty data
                if (!currentTickerData) {
                    console.log('filling empty ticker data for', currDate.format(dateFormat));
                    filledTickerData.push(
                        createEmptyTickerData(tickerName, currDate.format(dateFormat))
                    );
                    continue;
                }

                if (currentTickerData.ticker !== tickerName) {
                    throw new Error(`There shouldn't be multiple ticker (tickerName) when using putMiddleware!`);
                }

                const dateDiffWithCurrentTickerData = currDate.diff(currentTickerData.date, 'day');
                console.log('datediff', dateDiffWithCurrentTickerData);

                if (dateDiffWithCurrentTickerData === 0) {
                    filledTickerData.push(currentTickerData);
                    currentTickerDataId++;
                } else if (dateDiffWithCurrentTickerData > 0) {
                    // if current ticker data is earlier than currDate, something wrong
                    throw new Error('tickerData must be sorted!')
                } else {
                    // current tickerData.date jumps from previous date, so there is a gap
                    // fill it with empty data until the date sync up again
                    console.log('filling empty ticker data for', currDate.format(dateFormat));
                    filledTickerData.push(
                        createEmptyTickerData(tickerName, currDate.format(dateFormat))
                    );
                }
            }

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
