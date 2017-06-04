import React, { PureComponent } from 'react';
import moment from 'moment';

import Highcharts from 'highcharts/highstock';
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/boost')(Highcharts);

(function applyHighchartsTheme() {
    Highcharts.theme = {
        colors: ['#F3E796', '#95C471', '#35729E', '#251735'],
        colorAxis: {
            maxColor: '#05426E',
            minColor: '#F3E796'
        },
        plotOptions: {
            map: {
                nullColor: '#fcfefe'
            },
            candlestick: {
                lineColor: '#404048'
            }
        },
        navigator: {
            maskFill: 'rgba(170, 205, 170, 0.5)',
            series: {
                color: '#95C471',
                lineColor: '#35729E'
            }
        },
        chart: {
            backgroundColor: null,
            style: {
                fontFamily: 'Dosis, sans-serif'
            }
        },
        title: {
            style: {
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }
        },
        tooltip: {
            borderWidth: 0,
            backgroundColor: 'rgba(219,219,216,0.8)',
            shadow: false
        },
        legend: {
            itemStyle: {
                fontWeight: 'bold',
                fontSize: '13px'
            }
        },
        xAxis: {
            gridLineWidth: 1,
            labels: {
                style: {
                    fontSize: '12px'
                }
            }
        },
        yAxis: {
            minorTickInterval: 'auto',
            title: {
                style: {
                    textTransform: 'uppercase'
                }
            },
            labels: {
                style: {
                    fontSize: '12px'
                }
            }
        },
        // General
        background2: '#F0F0EA'
    };

    // Apply the theme
    Highcharts.setOptions(Highcharts.theme);
})();

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
            rangeSelector: {
                enabled: false
            },
            plotOptions: {
                series: {
                    showInNavigator: true,
                }
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
        if (!startDate || !endDate || !nextProps.shownTickers || nextProps.shownTickers.length === 0) {
            return;
        }

        const tickerData = nextProps.shownStockData[nextProps.shownTickers[0].value];
        let ohlc, volume;
        // ticker data can be empty from API
        if (!tickerData) {
            // if the chart data is already empty, then dont redraw empty chart
            if (this.chart.series[0].data.length === 0) {
                return;
            } else {
                // else draw empty chart
                ohlc = volume = [];
            }
        } else {
            // get ticker data for ticker name (right now only do the first one)
            ({ ohlc, volume } = this.processTickerDataToChartData(tickerData));
        }

        this.chart.series[0].update({
            data: ohlc,
            name: nextProps.shownTickers[0].value
        }, false);

        this.chart.series[1].update({
            data: volume,
            name: nextProps.shownTickers[0].value
        });
    }

    render() {
        return (
            <div id='stockChartContainer' style={{ height: "100%" }}>

            </div>
        );
    }
}

export default StockChart;