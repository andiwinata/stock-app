import { expect } from 'chai';
import { singleTickerJsonResp, multiTickerJsonResp } from '../../test/jsonResponseExample';

import { processQuandlJson, processQuandlJsonIDB } from './tickerDataProcessor';

describe('tickerDataProcessor test', () => {

    describe(`${processQuandlJson.name}`, () => {
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

    describe(`${processQuandlJsonIDB.name}`, () => {
        it('Process single ticker request json correctly', () => {
            const singleProcessResult = processQuandlJsonIDB(singleTickerJsonResp);
            expect(singleProcessResult).to.deep.equal({
                FB: [
                    { date: '20150102', ticker: 'FB', adj_open: 78.58, adj_high: 78.93, adj_low: 77.7, adj_close: 78.45, adj_volume: 18177475 },
                    { date: '20150105', ticker: 'FB', adj_open: 77.98, adj_high: 79.2455, adj_low: 76.86, adj_close: 77.19, adj_volume: 26452191 },
                    { date: '20150106', ticker: 'FB', adj_open: 77.23, adj_high: 77.59, adj_low: 75.365, adj_close: 76.15, adj_volume: 27399288 },
                    { date: '20150107', ticker: 'FB', adj_open: 76.76, adj_high: 77.36, adj_low: 75.82, adj_close: 76.15, adj_volume: 22045333 },
                ]
            });
        });

        it('Process multiple ticker request json correctly', () => {
            const multiProcessResult = processQuandlJsonIDB(multiTickerJsonResp);
            expect(multiProcessResult).to.deep.equal({
                FB: [
                    { date: '20150102', ticker: 'FB', adj_open: 78.58, adj_high: 78.93, adj_low: 77.7, adj_close: 78.45, adj_volume: 18177475 },
                    { date: '20150105', ticker: 'FB', adj_open: 77.98, adj_high: 79.2455, adj_low: 76.86, adj_close: 77.19, adj_volume: 26452191 },
                    { date: '20150106', ticker: 'FB', adj_open: 77.23, adj_high: 77.59, adj_low: 75.365, adj_close: 76.15, adj_volume: 27399288 },
                    { date: '20150107', ticker: 'FB', adj_open: 76.76, adj_high: 77.36, adj_low: 75.82, adj_close: 76.15, adj_volume: 22045333 },
                ],
                MSFT: [
                    { date: '20150102', ticker: 'MSFT', adj_open: 43.947628043932, adj_high: 44.663448817901, adj_low: 43.8346037112, adj_close: 44.041814987875, adj_volume: 27913852 },
                    { date: '20150105', ticker: 'MSFT', adj_open: 43.674485906497, adj_high: 44.013558904692, adj_low: 43.561461573765, adj_close: 43.632101781722, adj_volume: 39673865 },
                    { date: '20150106', ticker: 'MSFT', adj_open: 43.683904600891, adj_high: 44.031454424042, adj_low: 42.892734271767, adj_close: 42.996339910105, adj_volume: 36447854 },
                    { date: '20150107', ticker: 'MSFT', adj_open: 43.307156825118, adj_high: 43.759254156045, adj_low: 42.845640799796, adj_close: 43.542624184976, adj_volume: 29114061 },
                ]
            });
        });
    });
});