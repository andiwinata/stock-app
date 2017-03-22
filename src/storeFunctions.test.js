import { expect } from 'chai';
import * as storeFunctions from './storeFunctions';

describe(`storeFunctions test`, () => {

    let storedStockData;

    describe(`${storeFunctions.determineCachedStockDataStatus.name}`, () => {

        beforeEach(() => {
            storedStockData = {
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
            }
        });

        it('throws exception if ticker is not string', () => {
            expect(() => storeFunctions.determineCachedStockDataStatus(storedStockData,
                '2014-09-09',
                '2016-01-02',
                ['MSFT', 'FB', 'MS']
            )).to.throw(Error);
        });

        it('throws exception if ticker object does not have startDate', () => {
            const storedStockDataCopy = Object.assign({}, storedStockData);
            delete storedStockDataCopy['FB'].startDate;

            expect(() => storeFunctions.determineCachedStockDataStatus(storedStockDataCopy,
                '2014-09-09',
                '2016-01-02',
                'FB'
            )).to.throw(Error);
        });

        it('throws exception if ticker object does not have endDate', () => {
            const storedStockDataCopy = Object.assign({}, storedStockData);
            delete storedStockDataCopy['MSFT'].endDate;

            expect(() => storeFunctions.determineCachedStockDataStatus(storedStockDataCopy,
                '2014-09-09',
                '2016-01-02',
                'MSFT'
            )).to.throw(Error);
        });

        it('returns correct CacheStatus object for fully cached ticker', () => {
            const returnedCacheStatus = storeFunctions.determineCachedStockDataStatus(storedStockData,
                '2015-01-04',
                '2015-01-06',
                'MSFT',
                'YYYYMMDD'
            );

            expect(returnedCacheStatus).to.deep.equal({
                ticker: 'MSFT',
                cacheAvailability: storeFunctions.CACHE_AVAILABILITY.FULL,
                dateGaps: []
            });
        });

        it('returns correct CacheStatus object for partially cached ticker (Test 1)', () => {
            const returnedCacheStatus = storeFunctions.determineCachedStockDataStatus(storedStockData,
                '2014-09-09',
                '2016-01-02',
                'MSFT',
                'YYYYMMDD'
            );

            expect(returnedCacheStatus).to.deep.equal({
                ticker: 'MSFT',
                cacheAvailability: storeFunctions.CACHE_AVAILABILITY.PARTIAL,
                dateGaps: [
                    { startDate: '20140909', endDate: '20150101' },
                    { startDate: '20150108', endDate: '20160102' }
                ]
            });
        });

        it('returns correct CacheStatus object for partially cached ticker (Test 2)', () => {
            const returnedCacheStatus = storeFunctions.determineCachedStockDataStatus(storedStockData,
                '2015-01-05',
                '2016-01-02',
                'MSFT',
                'YYYYMMDD'
            );

            expect(returnedCacheStatus).to.deep.equal({
                ticker: 'MSFT',
                cacheAvailability: storeFunctions.CACHE_AVAILABILITY.PARTIAL,
                dateGaps: [
                    { startDate: '20150108', endDate: '20160102' }
                ]
            });
        });

        it('returns correct CacheStatus object for non cached ticker. (Test 1)', () => {
            const returnedCacheStatus = storeFunctions.determineCachedStockDataStatus(storedStockData,
                '2013-09-09',
                '2014-01-02',
                'MSFT',
                'YYYYMMDD'
            );

            expect(returnedCacheStatus).to.deep.equal({
                ticker: 'MSFT',
                cacheAvailability: storeFunctions.CACHE_AVAILABILITY.NONE,
                dateGaps: [
                    { startDate: '20130909', endDate: '20150101' }
                ]
            });
        });

        it('returns correct CacheStatus object for non cached ticker. (Test 2)', () => {
            const returnedCacheStatus = storeFunctions.determineCachedStockDataStatus(storedStockData,
                '2016-09-09',
                '2017-01-02',
                'MSFT',
                'YYYYMMDD'
            );

            expect(returnedCacheStatus).to.deep.equal({
                ticker: 'MSFT',
                cacheAvailability: storeFunctions.CACHE_AVAILABILITY.NONE,
                dateGaps: [
                    { startDate: '20150108', endDate: '20170102' }
                ]
            });
        });

        it('Follows the correct passed date format', () => {
            const returnedCacheStatus = storeFunctions.determineCachedStockDataStatus(storedStockData,
                '2016-09-09',
                '2017-01-15',
                'FB',
                'YY/M/D'
            );

            expect(returnedCacheStatus).to.deep.equal({
                ticker: 'FB',
                cacheAvailability: storeFunctions.CACHE_AVAILABILITY.NONE,
                dateGaps: [
                    { startDate: '15/1/8', endDate: '17/1/15' }
                ]
            });
        });

    });

});