import { expect } from 'chai';
import * as requestFunctions from './requestFunctions';
import * as storeFunctions from '../storeFunctions';
import URI from 'urijs';

describe(`requestFunctions test`, () => {

    describe(`${requestFunctions.constructRetrieveTickerDataUri.name}`, () => {

        it('gives correct url based on param correctly', () => {
            const constructedUrl = requestFunctions.constructRetrieveTickerDataUri(
                'http://server',
                ['FB', 'GOOG', 'GOOGL', 'MS'],
                '20160505',
                '20170102',
                123456789
            );

            expect(constructedUrl.toString()).to.deep.equal(
                new URI('http://server').setQuery({
                    'ticker': 'FB,GOOG,GOOGL,MS',
                    'date.gte': '20160505',
                    'date.lte': '20170102',
                    'api_key': 123456789
                }).toString()
            );
        });

        it('gives correct url based on param and extra params correctly', () => {
            const constructedUrl = requestFunctions.constructRetrieveTickerDataUri(
                'http://server',
                ['FB', 'GOOG', 'GOOGL', 'MS'],
                '20160505',
                '20170102',
                123456789,
                {
                    'helloParam': 'world',
                    'coolParam': 12938123,
                    'testParam': false
                }
            );

            expect(constructedUrl.toString()).to.deep.equal(
                new URI('http://server').setQuery({
                    'ticker': 'FB,GOOG,GOOGL,MS',
                    'date.gte': '20160505',
                    'date.lte': '20170102',
                    'api_key': 123456789,
                    'helloParam': 'world',
                    'coolParam': 12938123,
                    'testParam': false
                }).toString()
            );
        });

        it('ignores non-object extra params', () => {
            const constructedUrl = requestFunctions.constructRetrieveTickerDataUri(
                'http://server',
                ['FB', 'GOOG', 'GOOGL', 'MS'],
                '20160505',
                '20170102',
                123456789,
                ['extraparams', 'testparam']
            );

            expect(constructedUrl.toString()).to.deep.equal(
                new URI('http://server').setQuery({
                    'ticker': 'FB,GOOG,GOOGL,MS',
                    'date.gte': '20160505',
                    'date.lte': '20170102',
                    'api_key': 123456789
                }).toString()
            );
        });

        it('ignores null apiKey', () => {
            const constructedUrl = requestFunctions.constructRetrieveTickerDataUri(
                'http://server',
                ['FB', 'GOOG', 'GOOGL', 'MS'],
                '20160505',
                '20170102',
                null
            );

            expect(constructedUrl.toString()).to.deep.equal(
                new URI('http://server').setQuery({
                    'ticker': 'FB,GOOG,GOOGL,MS',
                    'date.gte': '20160505',
                    'date.lte': '20170102'
                }).toString()
            );
        });

        it('ignores undefined apiKey', () => {
            const constructedUrl = requestFunctions.constructRetrieveTickerDataUri(
                'http://server',
                ['FB', 'GOOG', 'GOOGL', 'MS'],
                '20160505',
                '20170102',
                undefined
            );

            expect(constructedUrl.toString()).to.deep.equal(
                new URI('http://server').setQuery({
                    'ticker': 'FB,GOOG,GOOGL,MS',
                    'date.gte': '20160505',
                    'date.lte': '20170102'
                }).toString()
            );
        });

    });

    describe(`${requestFunctions.getRequestListObjForCacheStatuses.name}`, () => {

        it('returns correct requestListObj for multiple tickers (some with same daterange)', () => {
            const cacheStatuses = [
                {
                    ticker: 'MSFT',
                    cacheAvailability: storeFunctions.CACHE_AVAILABILITY.PARTIAL,
                    dateGaps: [
                        { startDate: '20140909', endDate: '20150101' },
                        { startDate: '20150108', endDate: '20160102' }
                    ]
                },
                {
                    ticker: 'MS',
                    cacheAvailability: storeFunctions.CACHE_AVAILABILITY.PARTIAL,
                    dateGaps: [
                        { startDate: '20140909', endDate: '20150101' },
                        { startDate: '20150108', endDate: '20160102' }
                    ]
                },
                {
                    ticker: 'FB',
                    cacheAvailability: storeFunctions.CACHE_AVAILABILITY.NONE,
                    dateGaps: [
                        { startDate: '20140909', endDate: '20160102' }
                    ]
                }
            ];

            const reqListObj = requestFunctions.getRequestListObjForCacheStatuses(cacheStatuses);

            expect(reqListObj).to.deep.equal({
                '20140909-20150101': ['MSFT', 'MS'],
                '20150108-20160102': ['MSFT', 'MS'],
                '20140909-20160102': ['FB']
            });
        });

        it('returns correct requestListObj for multiple tickers (with all different daterange)', () => {
            const cacheStatuses = [
                {
                    ticker: 'MSFT',
                    cacheAvailability: storeFunctions.CACHE_AVAILABILITY.PARTIAL,
                    dateGaps: [
                        { startDate: '20140909', endDate: '20150101' },
                        { startDate: '20150108', endDate: '20160102' }
                    ]
                },
                {
                    ticker: 'AMZN',
                    cacheAvailability: storeFunctions.CACHE_AVAILABILITY.PARTIAL,
                    dateGaps: [
                        { startDate: '20120905', endDate: '20130502' },
                        { startDate: '20130705', endDate: '20130805' }
                    ]
                },
                {
                    ticker: 'FB',
                    cacheAvailability: storeFunctions.CACHE_AVAILABILITY.NONE,
                    dateGaps: [
                        { startDate: '20140909', endDate: '20160102' }
                    ]
                }
            ];

            const reqListObj = requestFunctions.getRequestListObjForCacheStatuses(cacheStatuses);

            expect(reqListObj).to.deep.equal({
                '20120905-20130502': ['AMZN'],
                '20130705-20130805': ['AMZN'],
                '20140909-20150101': ['MSFT'],
                '20150108-20160102': ['MSFT'],
                '20140909-20160102': ['FB']
            });
        });

        it('returns correct requestListObj for single ticker', () => {
            const cacheStatuses = [
                {
                    ticker: 'MSFT',
                    cacheAvailability: storeFunctions.CACHE_AVAILABILITY.PARTIAL,
                    dateGaps: [
                        { startDate: '2014/9/9', endDate: '2015/1/1' },
                        { startDate: '2015/1/8', endDate: '2016/1/2' }
                    ]
                }
            ];

            const reqListObj = requestFunctions.getRequestListObjForCacheStatuses(cacheStatuses);

            expect(reqListObj).to.deep.equal({
                '2014/9/9-2015/1/1': ['MSFT'],
                '2015/1/8-2016/1/2': ['MSFT']
            });
        });

    });

    describe(`${requestFunctions.getRequestUrisForCacheStatuses.name}`, () => {

        // TODO SINON
        // it('returns correct uri for cache statuses', () => {
        //     // mocking data
        //     const cacheStatuses = [
        //         {
        //             ticker: 'MSFT',
        //             cacheAvailability: storeFunctions.CACHE_AVAILABILITY.PARTIAL,
        //             dateGaps: [
        //                 { startDate: '20140909', endDate: '20150101' },
        //                 { startDate: '20150108', endDate: '20160102' }
        //             ]
        //         },
        //         {
        //             ticker: 'MS',
        //             cacheAvailability: storeFunctions.CACHE_AVAILABILITY.PARTIAL,
        //             dateGaps: [
        //                 { startDate: '20140909', endDate: '20150101' },
        //                 { startDate: '20150108', endDate: '20160102' }
        //             ]
        //         },
        //         {
        //             ticker: 'FB',
        //             cacheAvailability: storeFunctions.CACHE_AVAILABILITY.NONE,
        //             dateGaps: [
        //                 { startDate: '20140909', endDate: '20160102' }
        //             ]
        //         }
        //     ];
        //     const serverName = 'file:///test.com';

        //     const reqList = requestFunctions.getRequestListObjForCacheStatuses(cacheStatuses);

        //     // tested variables
        //     const uris = getRequestUrisForCacheStatuses(serverName, cacheStatuses);

        //     expect(uris).to.deep.equal({

        //     });
        // });

    });

});