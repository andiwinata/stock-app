import merge from 'lodash.merge';

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

export function processQuandlJson(jsonData) {
    // get the column data
    const columnsName = jsonData.datatable.columns;
    let jsonColumnNameToArrayIndex = {};
    columnsName.forEach((columnData, index) => {
        jsonColumnNameToArrayIndex[columnData.name] = index;
    });

    const tickerData = jsonData.datatable.data;

    let previousDailyTickerData = null;

    let processedData = {};
    tickerData.forEach((dailyTickerData, index) => {
        const tickerName = dailyTickerData[jsonColumnNameToArrayIndex['ticker']];
        const dateData = dailyTickerData[jsonColumnNameToArrayIndex['date']];

        // create defaults
        if (!(tickerName in processedData)) {
            processedData[tickerName] = {};
            processedData[tickerName].dailyData = {};
        }

        // Setting start and end date:
        // if first loop, set start date
        if (!previousDailyTickerData) {
            processedData[tickerName].startDate = dateData;
        } else if (tickerName != previousDailyTickerData.tickerName) {
            // if this ticker has different name from previous one and 
            // previous one is not null
            // set the start date for current data
            processedData[tickerName].startDate = dateData;
            // and last date for previous data
            processedData[previousDailyTickerData.tickerName].endDate = previousDailyTickerData.dateData;
        } else if (index == tickerData.length - 1) {
            // or if it is last element, set end date
            processedData[tickerName].endDate = dateData;
        }

        // set price data for this date
        let priceData = [];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['open']] = dailyTickerData[jsonColumnNameToArrayIndex['open']];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['high']] = dailyTickerData[jsonColumnNameToArrayIndex['high']];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['low']] = dailyTickerData[jsonColumnNameToArrayIndex['low']];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['close']] = dailyTickerData[jsonColumnNameToArrayIndex['close']];
        priceData[TICKER_DATA_COL_NAME_TO_INDEX['volume']] = dailyTickerData[jsonColumnNameToArrayIndex['volume']];
        processedData[tickerName].dailyData[dateData] = priceData;

        // set the previous ticker data
        previousDailyTickerData = {
            tickerName,
            dateData
        };
    });

    return processedData;
}