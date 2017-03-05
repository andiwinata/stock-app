import merge from 'lodash.merge';

/**
 * This is for used by the application to determine which array index to take from store
 */
export const storeTickerDataColNameToIndex = {
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

        // Setting earliest and latest date:
        // if first loop, set earliest date
        if (!previousDailyTickerData) {
            processedData[tickerName].earliestDate = dateData;
        } else if (tickerName != previousDailyTickerData.tickerName) {
            // if this ticker has different name from previous one and 
            // previous one is not null
            // set the earliest date for current data
            processedData[tickerName].earliestDate = dateData;
            // and last date for previous data
            processedData[previousDailyTickerData.tickerName].latestDate = previousDailyTickerData.dateData;
        } else if (index == tickerData.length - 1) {
            // or if it is last element, set latest date
            processedData[tickerName].latestDate = dateData;
        }

        // set price data for this date
        let priceData = [];
        priceData[storeTickerDataColNameToIndex['open']] = dailyTickerData[jsonColumnNameToArrayIndex['open']];
        priceData[storeTickerDataColNameToIndex['high']] = dailyTickerData[jsonColumnNameToArrayIndex['high']];
        priceData[storeTickerDataColNameToIndex['low']] = dailyTickerData[jsonColumnNameToArrayIndex['low']];
        priceData[storeTickerDataColNameToIndex['close']] = dailyTickerData[jsonColumnNameToArrayIndex['close']];
        priceData[storeTickerDataColNameToIndex['volume']] = dailyTickerData[jsonColumnNameToArrayIndex['volume']];
        processedData[tickerName].dailyData[dateData] = priceData;

        // set the previous ticker data
        previousDailyTickerData = {
            tickerName,
            dateData
        };
    });

    return processedData;
}