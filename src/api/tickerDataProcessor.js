import merge from 'lodash.merge';
import moment from 'moment';

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
            adj_open: +tickerDatum[jsonColumnNameToArrayIndex['adj_open']].toFixed(2),
            adj_high: +tickerDatum[jsonColumnNameToArrayIndex['adj_high']].toFixed(2),
            adj_low: +tickerDatum[jsonColumnNameToArrayIndex['adj_low']].toFixed(2),
            adj_close: +tickerDatum[jsonColumnNameToArrayIndex['adj_close']].toFixed(2),
            adj_volume: tickerDatum[jsonColumnNameToArrayIndex['adj_volume']],
        });
    });

    return processedData;
}