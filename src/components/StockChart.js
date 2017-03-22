import React, { PureComponent } from 'react';
import Highcharts from 'highcharts/highstock';
require('highcharts/modules/exporting')(Highcharts);

class StockChart extends PureComponent {
    componentDidMount() {
        const options = {
            chart: {
                renderTo: 'stockChartContainer',
                type: 'bar'
            },
            rangeSelector: {
                selected: 1
            },
            title: {
                text: 'Fruit Consumption'
            },
            xAxis: {
                categories: ['Apples', 'Bananas', 'Oranges']
            },
            yAxis: {
                title: {
                    text: 'Fruit eaten'
                }
            },
            series: [{
                name: 'Jane',
                data: [1, 0, 4]
            }, {
                name: 'John',
                data: [5, 7, 3]
            }]
        };

        this.chart = new Highcharts.StockChart(options);
    }

    render() {
        return (
            <div id='stockChartContainer'>

            </div>
        );
    }
}

export default StockChart;