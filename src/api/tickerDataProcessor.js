import merge from 'lodash.merge';
import moment from 'moment';

/**
 * This is for used by the application to determine which array index to take from store
 */
export const TICKER_DATA_COL_NAME_TO_INDEX = {
    open: 0,
    high: 1,
    low: 2,
    close: 3,
    volume: 4
}

export function processQuandlJson(jsonData, reqStartDate, reqEndDate, dateFormat = 'YYYY-MM-DD') {
    // reqStartDate and reqEndDate must have same logical value (XOR operator)
    if (reqStartDate ? !reqEndDate : reqEndDate) {
        throw new Error('reqStartDate and reqEndDate must always have same value, whether to declare all of them or dont declare');
    }

    // get the column data
    const columnsName = jsonData.datatable.columns;
    let jsonColumnNameToArrayIndex = {};
    columnsName.forEach((columnData, index) => {
        jsonColumnNameToArrayIndex[columnData.name] = index;
    });

    const tickerData = jsonData.datatable.data;
    const requestDateRangeProvided = reqStartDate && reqEndDate;
    const formatDate = (date) => moment(date).format(dateFormat);

    // format request date if exist
    if (reqStartDate) {
        reqStartDate = formatDate(reqStartDate);
    }

    if (reqEndDate) {
        reqEndDate = formatDate(reqEndDate);
    }

    let previousDailyTickerData = null;

    const processedData = {};
    tickerData.forEach((dailyTickerData, index) => {
        const tickerName = dailyTickerData[jsonColumnNameToArrayIndex['ticker']];
        // get date data formmated properly
        const dateData = formatDate(dailyTickerData[jsonColumnNameToArrayIndex['date']]);

        // create defaults
        if (!(tickerName in processedData)) {
            processedData[tickerName] = {};
            processedData[tickerName].dailyData = {};
        }

        // Setting start and end date:
        // if first loop, set start date
        if (!previousDailyTickerData) {
            // if request data provided, just use request data, otherwise use the first date
            processedData[tickerName].startDate = requestDateRangeProvided ? reqStartDate : dateData;
        } else if (tickerName != previousDailyTickerData.tickerName) {
            // if this ticker has different name from previous one and 
            // previous one is not null
            // set the start date for current data
            processedData[tickerName].startDate = requestDateRangeProvided ? reqStartDate : dateData;
            // and last date for previous data
            processedData[previousDailyTickerData.tickerName].endDate = requestDateRangeProvided ? reqEndDate : previousDailyTickerData.dateData;
        } else if (index == tickerData.length - 1) {
            // or if it is last element, set end date
            processedData[tickerName].endDate = requestDateRangeProvided ? reqEndDate : dateData;
        }

        // set price data for this date
        const priceData = [];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['open']] = dailyTickerData[jsonColumnNameToArrayIndex['open']];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['high']] = dailyTickerData[jsonColumnNameToArrayIndex['high']];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['low']] = dailyTickerData[jsonColumnNameToArrayIndex['low']];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['close']] = dailyTickerData[jsonColumnNameToArrayIndex['close']];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['volume']] = dailyTickerData[jsonColumnNameToArrayIndex['volume']];
        processedData[tickerName].dailyData[dateData] = priceData;

        // set the previous ticker data for setting startDate and endDate
        previousDailyTickerData = {
            tickerName,
            dateData
        };
    });

    return processedData;
}

export function processQuandlJsonIDB(jsonData, reqStartDate, reqEndDate, dateFormat = 'YYYYMMDD') {
    const columnsName = jsonData.datatable.columns;

    let jsonColumnNameToArrayIndex = {};
    columnsName.forEach((columnData, index) => {
        jsonColumnNameToArrayIndex[columnData.name] = index;
    });

    const tickerData = jsonData.datatable.data;
    const processedData = {};

    tickerData.forEach(tickerDatum => {
        const tickerName = tickerDatum[jsonColumnNameToArrayIndex['ticker']];

        if (!processedData[tickerName]) {
            processedData[tickerName] = [];
        }

        processedData[tickerName].push({
            date: moment(tickerDatum[jsonColumnNameToArrayIndex['date']]).format(dateFormat),
            ticker: tickerName,
            adj_open: tickerDatum[jsonColumnNameToArrayIndex['adj_open']],
            adj_high: tickerDatum[jsonColumnNameToArrayIndex['adj_high']],
            adj_low: tickerDatum[jsonColumnNameToArrayIndex['adj_low']],
            adj_close: tickerDatum[jsonColumnNameToArrayIndex['adj_close']],
            adj_volume: tickerDatum[jsonColumnNameToArrayIndex['adj_volume']],
        });
    });

    return processedData;
}