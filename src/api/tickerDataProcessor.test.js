import { expect } from 'chai';
import { singleTickerJsonResp, multiTickerJsonResp } from '../../test/jsonResponseExample';

import { processQuandlJson } from './tickerDataProcessor';

describe('Ticker Data Processor Test', () => {

    it('Process single ticker request json correctly', () => {
        const singleProcessResult = processQuandlJson(singleTickerJsonResp);
        expect(singleProcessResult).to.deep.equal({
            FB: {
                "startDate": "2015-01-02",
                "endDate": "2015-01-07",
                "dailyData": {
                    "2015-01-02": [
                        78.58,
                        78.93,
                        77.7,
                        78.45,
                        18177475
                    ],
                    "2015-01-05": [
                        77.98,
                        79.2455,
                        76.86,
                        77.19,
                        26452191,
                    ],
                    "2015-01-06": [
                        77.23,
                        77.59,
                        75.365,
                        76.15,
                        27399288,
                    ],
                    "2015-01-07": [
                        76.76,
                        77.36,
                        75.82,
                        76.15,
                        22045333,
                    ]
                }
            }
        });

    });

    it('Process multiple ticker request json correctly', () => {
        const multiProcessResult = processQuandlJson(multiTickerJsonResp);
        expect(multiProcessResult).to.deep.equal({
            FB: {
                "startDate": "2015-01-02",
                "endDate": "2015-01-07",
                "dailyData": {
                    "2015-01-02": [
                        78.58,
                        78.93,
                        77.7,
                        78.45,
                        18177475
                    ],
                    "2015-01-05": [
                        77.98,
                        79.2455,
                        76.86,
                        77.19,
                        26452191,
                    ],
                    "2015-01-06": [
                        77.23,
                        77.59,
                        75.365,
                        76.15,
                        27399288,
                    ],
                    "2015-01-07": [
                        76.76,
                        77.36,
                        75.82,
                        76.15,
                        22045333,
                    ]
                }
            },
            MSFT: {
                "startDate": "2015-01-02",
                "endDate": "2015-01-07",
                "dailyData": {
                    "2015-01-02": [
                        46.66,
                        47.42,
                        46.54,
                        46.76,
                        27913852,
                    ],
                    "2015-01-05": [
                        46.37,
                        46.73,
                        46.25,
                        46.325,
                        39673865,
                    ],
                    "2015-01-06": [
                        46.38,
                        46.749,
                        45.54,
                        45.65,
                        36447854,
                    ],
                    "2015-01-07": [
                        45.98,
                        46.46,
                        45.49,
                        46.23,
                        29114061,
                    ]
                }
            }
        });
    });

    it('Process single ticker request json correctly with passed startDate and endDate', () => {
        const singleProcessResult = processQuandlJson(singleTickerJsonResp, '20110101', '20170320');
        expect(singleProcessResult).to.deep.equal({
            FB: {
                "startDate": "2011-01-01",
                "endDate": "2017-03-20",
                "dailyData": {
                    "2015-01-02": [
                        78.58,
                        78.93,
                        77.7,
                        78.45,
                        18177475
                    ],
                    "2015-01-05": [
                        77.98,
                        79.2455,
                        76.86,
                        77.19,
                        26452191,
                    ],
                    "2015-01-06": [
                        77.23,
                        77.59,
                        75.365,
                        76.15,
                        27399288,
                    ],
                    "2015-01-07": [
                        76.76,
                        77.36,
                        75.82,
                        76.15,
                        22045333,
                    ]
                }
            }
        });

    });

    it('Process multiple ticker request json correctly with passed startDate and endDate', () => {
        const multiProcessResult = processQuandlJson(multiTickerJsonResp, '20110101', '20170320');
        expect(multiProcessResult).to.deep.equal({
            FB: {
                "startDate": "2011-01-01",
                "endDate": "2017-03-20",
                "dailyData": {
                    "2015-01-02": [
                        78.58,
                        78.93,
                        77.7,
                        78.45,
                        18177475
                    ],
                    "2015-01-05": [
                        77.98,
                        79.2455,
                        76.86,
                        77.19,
                        26452191,
                    ],
                    "2015-01-06": [
                        77.23,
                        77.59,
                        75.365,
                        76.15,
                        27399288,
                    ],
                    "2015-01-07": [
                        76.76,
                        77.36,
                        75.82,
                        76.15,
                        22045333,
                    ]
                }
            },
            MSFT: {
                "startDate": "2011-01-01",
                "endDate": "2017-03-20",
                "dailyData": {
                    "2015-01-02": [
                        46.66,
                        47.42,
                        46.54,
                        46.76,
                        27913852,
                    ],
                    "2015-01-05": [
                        46.37,
                        46.73,
                        46.25,
                        46.325,
                        39673865,
                    ],
                    "2015-01-06": [
                        46.38,
                        46.749,
                        45.54,
                        45.65,
                        36447854,
                    ],
                    "2015-01-07": [
                        45.98,
                        46.46,
                        45.49,
                        46.23,
                        29114061,
                    ]
                }
            }
        });
    });

    it('Throws exception if only either startDate or endDate passed', () => {
        expect(() => processQuandlJson(singleTickerJsonResp, '20110101'))
            .to.throw(Error);
    });

    it('Process request json correctly with correct passed dateformat', () => {
        const multiProcessResult = processQuandlJson(multiTickerJsonResp, null, null, 'YY/MM/DD');
        expect(multiProcessResult).to.deep.equal({
            FB: {
                "startDate": "15/01/02",
                "endDate": "15/01/07",
                "dailyData": {
                    "15/01/02": [
                        78.58,
                        78.93,
                        77.7,
                        78.45,
                        18177475
                    ],
                    "15/01/05": [
                        77.98,
                        79.2455,
                        76.86,
                        77.19,
                        26452191,
                    ],
                    "15/01/06": [
                        77.23,
                        77.59,
                        75.365,
                        76.15,
                        27399288,
                    ],
                    "15/01/07": [
                        76.76,
                        77.36,
                        75.82,
                        76.15,
                        22045333,
                    ]
                }
            },
            MSFT: {
                "startDate": "15/01/02",
                "endDate": "15/01/07",
                "dailyData": {
                    "15/01/02": [
                        46.66,
                        47.42,
                        46.54,
                        46.76,
                        27913852,
                    ],
                    "15/01/05": [
                        46.37,
                        46.73,
                        46.25,
                        46.325,
                        39673865,
                    ],
                    "15/01/06": [
                        46.38,
                        46.749,
                        45.54,
                        45.65,
                        36447854,
                    ],
                    "15/01/07": [
                        45.98,
                        46.46,
                        45.49,
                        46.23,
                        29114061,
                    ]
                }
            }
        });
    });
});