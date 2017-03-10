import { expect } from 'chai';
import * as actionTypes from './actionTypes';
import * as reducer from './reducer';

describe('Reducer Test.', () => {

    describe('storedStockData', () => {

        it('merges correctly with empty state', () => {
            const state = {};
            const action = {
                type: actionTypes.TICKER_DATA_RECEIVED,
                receivedTickerData: {
                    MSFT: {
                        dailyData: {
                            '2017-02-17': [
                                64.47,
                                64.69,
                                64.3,
                                64.62,
                                21141635
                            ],
                            '2017-02-21': [
                                64.61,
                                64.95,
                                64.45,
                                64.49,
                                19098916
                            ],
                            '2017-02-22': [
                                64.33,
                                64.39,
                                64.05,
                                64.36,
                                19259698
                            ]
                        },
                        startDate: '2017-02-17',
                        endDate: '2017-02-22'
                    }
                }
            };

            const result = reducer.storedStockData(state, action);
            expect(result).to.deep.equal({
                MSFT: {
                    dailyData: {
                        '2017-02-17': [
                            64.47,
                            64.69,
                            64.3,
                            64.62,
                            21141635
                        ],
                        '2017-02-21': [
                            64.61,
                            64.95,
                            64.45,
                            64.49,
                            19098916
                        ],
                        '2017-02-22': [
                            64.33,
                            64.39,
                            64.05,
                            64.36,
                            19259698
                        ]
                    },
                    startDate: '2017-02-17',
                    endDate: '2017-02-22'
                }
            });
        });

        it('merges correctly with same ticker and received data has wider date coverage', () => {
            expect(true).to.deep.equal(true);
        });

        it('merges correctly with same ticker and received data has wider date coverage. And there is another ticker in the state', () => {
            expect(true).to.deep.equal(true);
        });

        it('merges correctly with same ticker and received data has narrower date coverage', () => {
            expect(true).to.deep.equal(true);
        });

        it('merges correctly with same ticker and received data has narrower date coverage. And there is another ticker in the state', () => {
            expect(true).to.deep.equal(true);
        });

        it('merges correctly with different ticker and same date.', () => {
            expect(true).to.deep.equal(true);
        });

        it('merges correctly with different ticker and different date. (unlikely to happen unless using query parameter)', () => {
            expect(true).to.deep.equal(true);
        });
    });

    describe('storedStockMergeCustomizer', () => {
        describe('works by merging all data but only pick earliest date for startDate and latest date for endDate.', () => {
            it('Testing with earliest and latest date from objValue', () => {
                const objValue = {
                    startDate: '2016-12-10',
                    endDate: '2017-03-10',
                    dailyData: {
                        '2015': 'a',
                        '2016': 'b'
                    }
                };

                const srcValue = {
                    startDate: '2017-01-10',
                    endDate: '2017-02-15',
                    dailyData: {
                        '2015': 'c',
                        '2017': 'd'
                    }
                };

                const result = reducer.storedStockMergeCustomizer(objValue, srcValue);

                expect(result).to.deep.equal({
                    startDate: '2016-12-10',
                    endDate: '2017-03-10',
                    dailyData: {
                        '2015': 'c',
                        '2016': 'b',
                        '2017': 'd'
                    }
                });
            });

            it('Testing with earliest and latest date from srcValue', () => {
                const objValue = {
                    startDate: '2016-12-10',
                    endDate: '2017-03-10',
                    dailyData: {
                        '2015': 'a',
                        '2016': 'b'
                    }
                };

                const srcValue = {
                    startDate: '2015-01-10',
                    endDate: '2018-02-15',
                    dailyData: {
                        '2015': 'c',
                        '2017': 'd'
                    }
                };

                const result = reducer.storedStockMergeCustomizer(objValue, srcValue);

                expect(result).to.deep.equal({
                    startDate: '2015-01-10',
                    endDate: '2018-02-15',
                    dailyData: {
                        '2015': 'c',
                        '2016': 'b',
                        '2017': 'd'
                    }
                });
            });

            it('Testing with earliest and latest date from mixed srcValue and objValue', () => {
                const objValue = {
                    startDate: '2016-12-10',
                    endDate: '2018-03-10',
                    dailyData: {
                        '2015': 'a',
                        '2016': 'b'
                    }
                };

                const srcValue = {
                    startDate: '2015-01-10',
                    endDate: '2017-02-15',
                    dailyData: {
                        '2015': 'c',
                        '2017': 'd'
                    }
                };

                const result = reducer.storedStockMergeCustomizer(objValue, srcValue);

                expect(result).to.deep.equal({
                    startDate: '2015-01-10',
                    endDate: '2018-03-10',
                    dailyData: {
                        '2015': 'c',
                        '2016': 'b',
                        '2017': 'd'
                    }
                });
            });
        });

    });

});