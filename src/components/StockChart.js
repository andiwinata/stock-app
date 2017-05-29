import React, { PureComponent } from 'react';
import moment from 'moment';

import Highcharts from 'highcharts/highstock';
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/boost')(Highcharts);

// workaround of a bug tooltip not showing up outside chart area
// https://github.com/highcharts/highcharts/issues/6456
Highcharts.wrap(Highcharts.Pointer.prototype, 'getHoverData', function (proceed, a, b, c, isDirectTouch, shared, f) {
    var directTouch = shared ? false : directTouch;
    return proceed.apply(this, [a, b, c, directTouch, shared, f]);
});

import { TICKER_DATA_COL_NAME_TO_INDEX } from '../api/tickerDataProcessor';

const groupingUnits = [
    ['week', [1]],
    ['month', [1, 2, 3, 4, 6]]
];

class StockChart extends PureComponent {
    componentDidMount() {
        const options = {
            chart: {
                renderTo: 'stockChartContainer'
            },
            plotOptions: {
                series: {
                    showInNavigator: true,
                }
            },
            title: {
                text: 'Stock Historical'
            },
            xAxis: [{
                type: 'datetime',
                dateTimeLabelFormats: {
                    day: '%e of %b'
                }
            }],
            yAxis: [{
                labels: {
                    align: 'right',
                    x: -3
                },
                title: {
                    text: 'OHLC'
                },
                height: '60%',
                lineWidth: 2,
                crosshair: true
            }, {
                labels: {
                    align: 'right',
                    x: -3
                },
                title: {
                    text: 'Volume'
                },
                top: '65%',
                height: '35%',
                offset: 0,
                lineWidth: 2
            }],
            tooltip: {
                split: true,
                shared: true,
                useHTML: true
            },
            series: [{
                type: 'candlestick',
                name: '',
                data: [],
                dataGrouping: {
                    units: groupingUnits
                },
                stickyTracking: true,
            }, {
                type: 'column',
                name: 'Volume',
                data: [],
                yAxis: 1,
                dataGrouping: {
                    units: groupingUnits
                },
                stickyTracking: true,
            }]
        };

        this.chart = new Highcharts.StockChart(options);
    }

    processTickerDataToChartData(tickerData) {
        // can be null since the API might not have the data
        if (!tickerData) {
            return;
        }

        const ohlc = [];
        const volume = [];

        tickerData.forEach(tickerDatum => {
            const unixDate = moment.utc(tickerDatum['date']).valueOf();
            
            ohlc.push([
                unixDate,
                tickerDatum['adj_open'],
                tickerDatum['adj_high'],
                tickerDatum['adj_low'],
                tickerDatum['adj_close']
            ]);

            volume.push([
                unixDate,
                tickerDatum['adj_volume']
            ]);
        });

        return { ohlc, volume };
    }

    componentWillReceiveProps(nextProps) {
        // don't render new chart unless the data has been changed
        if (this.props.shownStockData === nextProps.shownStockData) {
            return;
        }

        console.log('DRAWING STOCK CHART!');

        const { startDate, endDate } = nextProps.shownDate;
        // console.log(nextProps.storedStockData, startDate, endDate, nextProps.shownTickers, "!!!!!!!!!!!!!!!!!!!!!!!!!!!xxxxxxxxxxx");

        if (!startDate || !endDate || !nextProps.shownTickers || nextProps.shownTickers.length === 0) {
            return;
        }

        // get ticker data for ticker name (right now only do the first one)
        const { ohlc, volume } = this.processTickerDataToChartData(nextProps.shownStockData[nextProps.shownTickers[0].value]);

        this.chart.series[0].update({
            data: ohlc,
            name: nextProps.shownTickers[0].value
        }, false);

        this.chart.series[1].update({
            data: volume,
            name: nextProps.shownTickers[0].value
        });

        // // right now just do one ticker
        // const storedTickerData = nextProps.storedStockData[nextProps.shownTickers[0].value].dailyData;
        // // console.log("COMPONENT WILL RECEIVE nextPROPSS STOCK CHART!!!!!!!!", storedTickerData);

        // this.ohlc = [];
        // this.volume = [];

        // const dateKeys = Object.keys(storedTickerData);
        // dateKeys.sort((a, b) => {
        //     return new Date(a) - new Date(b);
        // });

        // dateKeys.forEach((storedDate) => {
        //     // date in range inclusive
        //     const dateInRange = moment(storedDate).isBetween(startDate, endDate, 'days', '[]');

        //     if (dateInRange) {
        //         const ohlcData = [
        //             moment(storedDate).valueOf(),
        //             storedTickerData[storedDate][TICKER_DATA_COL_NAME_TO_INDEX['open']],
        //             storedTickerData[storedDate][TICKER_DATA_COL_NAME_TO_INDEX['high']],
        //             storedTickerData[storedDate][TICKER_DATA_COL_NAME_TO_INDEX['low']],
        //             storedTickerData[storedDate][TICKER_DATA_COL_NAME_TO_INDEX['close']],
        //         ];

        //         this.ohlc.push(ohlcData);

        //         const volumeData = [
        //             moment(storedDate).valueOf(),
        //             storedTickerData[storedDate][TICKER_DATA_COL_NAME_TO_INDEX['volume']]
        //         ]

        //         this.volume.push(volumeData);
        //     }
        // });
        // // console.log("FINAL DATA", this.ohlc, this.volume, this.ohlc.length);

        // this.chart.series[0].update({
        //     data: this.ohlc,
        //     name: nextProps.shownTickers[0].value
        // }, false);

        // this.chart.series[1].update({
        //     data: this.volume,
        //     name: nextProps.shownTickers[0].value
        // });
    }

    render() {
        return (
            <div id='stockChartContainer' style={{ height: "100%" }}>

            </div>
        );
    }
}

export default StockChart;