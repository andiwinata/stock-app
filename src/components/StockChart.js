import React, { PureComponent } from 'react';
import moment from 'moment';

import styles from './StockChart.scss';

import Highcharts from 'highcharts/highstock';
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/boost')(Highcharts);

import { CHART_TYPES } from './ChartType';

(function applyHighchartsTheme() {
    Highcharts.theme = {
        colors: ['#222', '#222', '#35729E', '#251735'],
        colorAxis: {
            maxColor: '#05426E',
            minColor: '#F3E796'
        },
        plotOptions: {
            area: {
                fillOpacity: 0.2,
            },
            map: {
                nullColor: '#fcfefe'
            },
            candlestick: {
                lineColor: '#222',
                upColor: '#fff',
            }
        },
        navigator: {
            maskFill: 'rgba(128, 128, 128, 0.5)',
            series: {
                color: '#222',
                lineColor: '#222',
                fillOpacity: 0.075,
            }
        },
        chart: {
            backgroundColor: null,
            style: {
                fontFamily: "'Roboto', sans-serif"
            }
        },
        title: {
            style: {
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
            }
        },
        tooltip: {
            borderWidth: 0,
            backgroundColor: 'rgba(219, 219, 216, 0.97)',
            shadow: false
        },
        legend: {
            itemStyle: {
                fontWeight: 'bold',
                fontSize: '13px'
            }
        },
        xAxis: {
            gridLineWidth: 2,
            labels: {
                style: {
                    fontSize: '12px',
                }
            },
            lineColor: '#222',
            lineWidth: 0,
        },
        yAxis: {
            minorTickInterval: 'auto',
            title: {
                style: {
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: '#222',
                }
            },
            labels: {
                style: {
                    fontSize: '12px'
                }
            },
            lineColor: '#222',
            lineWidth: 0,
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

const chartOnClick = function (e) {
    // remove focus from currently focused object when clicking on chart
    document.activeElement.blur();
};

const getUtcUnix = (date) => moment.utc(date).valueOf();

const datumUnixDateGetter = (datum) => getUtcUnix(datum['date']);

const chartTypeToFields = {
    [CHART_TYPES.OHLC]: [datumUnixDateGetter, 'adj_open', 'adj_high', 'adj_low', 'adj_close'],
    [CHART_TYPES.CANDLESTICK]: [datumUnixDateGetter, 'adj_open', 'adj_high', 'adj_low', 'adj_close'],
    [CHART_TYPES.AREA]: [datumUnixDateGetter, 'adj_close'],
    [CHART_TYPES.LINE]: [datumUnixDateGetter, 'adj_close'],
}

class StockChart extends PureComponent {
    componentDidMount() {
        const priceSeries = {
            type: this.props.chartType,
            name: '',
            data: [],
            dataGrouping: {
                units: groupingUnits
            },
            stickyTracking: true,
        };

        const volumeSeries = {
            type: 'column',
            name: '',
            data: [],
            yAxis: 1,
            dataGrouping: {
                units: groupingUnits
            },
            stickyTracking: true,
        };

        const chartOptions = {
            chart: {
                events: {
                    click: chartOnClick,
                },
                renderTo: 'stockChartContainer',
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
                    align: 'left',
                    x: -3
                },
                title: {
                    text: 'Price'
                },
                height: '75%',
                crosshair: true
            }, {
                labels: {
                    align: 'left',
                    x: -3
                },
                title: {
                    text: 'Volume'
                },
                top: '75%',
                height: '25%',
                offset: 0,
            }],
            tooltip: {
                split: true,
                shared: true,
                useHTML: true
            },
            series: [priceSeries, volumeSeries],
        };

        this.chart = new Highcharts.StockChart(chartOptions);
    }

    processTickerDataToChartData(tickerData, chartType) {
        const priceData = [];
        const volume = [];
        console.log('CHART TYPE', chartType);

        const selectors = chartTypeToFields[chartType];

        tickerData.forEach((datum) => {
            // get selected data based on selectors
            const selectedData = selectors.map((selector) => {
                // if current selector is function, pass in the datum
                if (typeof selector === 'function') {
                    return selector(datum)
                }
                // otherwise it should be the string key to datum field
                return datum[selector];
            })

            priceData.push(selectedData);
            volume.push([
                datumUnixDateGetter(datum),
                datum['adj_volume'],
            ]);
        });

        return { priceData, volume };
    }

    componentWillReceiveProps(nextProps) {
        // don't render new chart unless the data has been changed
        // or chart type has been changed
        if (this.props.shownStockData === nextProps.shownStockData &&
            this.props.chartType === nextProps.chartType) {
            return;
        }

        console.log('DRAWING STOCK CHART!', nextProps);
        const { startDate, endDate } = nextProps.shownDate;
        if (!startDate || !endDate || !nextProps.shownTickers || nextProps.shownTickers.length === 0) {
            return;
        }

        const tickerData = nextProps.shownStockData[nextProps.shownTickers[0].value];
        let priceData, volume;
        // ticker data can be empty from API
        if (!tickerData) {
            // if the chart data is already empty, then dont redraw empty chart
            if (this.chart.series[0].data.length === 0) {
                return;
            } else {
                // else draw empty chart
                priceData = volume = [];
            }
        } else {
            // get ticker data for ticker name (right now only do the first one)
            ({ priceData, volume } = this.processTickerDataToChartData(tickerData, nextProps.chartType));
        }

        this.chart.series[0].update({
            data: priceData,
            name: nextProps.shownTickers[0].value,
            type: nextProps.chartType,
        }, false);

        this.chart.series[1].update({
            data: volume,
            name: nextProps.shownTickers[0].value,
        });
    }

    render() {
        return (
            <div id='stockChartContainer' className={styles.stockChartContainer}>

            </div>
        );
    }
}

export default StockChart;