import { expect } from 'chai';
import * as requestFunctions from './requestFunctions';
import { CACHE_AVAILABILITY, cacheStatusFactory, dateGapFactory } from '../cache/quandlIDB';
import URI from 'urijs';
import sinon from 'sinon';

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

    const hostUrl = 'http://host/com';

    describe(`${requestFunctions.generateUrisFromCacheStatuses.name}`, () => {

        it('returns correct uris for multiple tickers (some with same daterange)', () => {
            const cacheStatuses = [
                cacheStatusFactory('MSFT', CACHE_AVAILABILITY.PARTIAL, [], [dateGapFactory('20140909', '20150101'), dateGapFactory('20150108', '20160102')]),
                cacheStatusFactory('MS', CACHE_AVAILABILITY.PARTIAL, [], [dateGapFactory('20140909', '20150101'), dateGapFactory('20150108', '20160102')]),
                cacheStatusFactory('FB', CACHE_AVAILABILITY.NONE, [], [dateGapFactory('20140909', '20160102')])
            ];

            const generatedUrl = requestFunctions.generateUrisFromCacheStatuses(cacheStatuses, hostUrl);
            const expected = [
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['MSFT', 'MS'], '20140909', '20150101'),
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['MSFT', 'MS'], '20150108', '20160102'),
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['FB'], '20140909', '20160102'),
            ];

            expect(generatedUrl.sort()).to.deep.equal(expected.sort());
        });

        it('returns correct uris for multiple tickers (with all different daterange)', () => {
            const cacheStatuses = [
                cacheStatusFactory('MSFT', CACHE_AVAILABILITY.PARTIAL, [], [dateGapFactory('20140909', '20150101'), dateGapFactory('20150108', '20160102')]),
                cacheStatusFactory('AMZN', CACHE_AVAILABILITY.PARTIAL, [], [dateGapFactory('20120905', '20130502'), dateGapFactory('20130705', '20130805')]),
                cacheStatusFactory('FB', CACHE_AVAILABILITY.NONE, [], [dateGapFactory('20140909', '20160102')])
            ];

            const generatedUrl = requestFunctions.generateUrisFromCacheStatuses(cacheStatuses, hostUrl);
            const expected = [
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['AMZN'], '20120905', '20130502'),
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['AMZN'], '20130705', '20130805'),
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['MSFT'], '20140909', '20150101'),
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['MSFT'], '20150108', '20160102'),
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['FB'], '20140909', '20160102'),
            ];

            expect(generatedUrl.sort()).to.deep.equal(expected.sort());
        });

        it('returns correct requestListObj for single ticker', () => {
            const cacheStatuses = [
                cacheStatusFactory('MSFT', CACHE_AVAILABILITY.PARTIAL, [], [dateGapFactory('20140909', '20150101'), dateGapFactory('20150108', '20160102')]),
            ];

            const generatedUrl = requestFunctions.generateUrisFromCacheStatuses(cacheStatuses, hostUrl);
            const expected = [
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['MSFT'], '20140909', '20150101'),
                requestFunctions.constructRetrieveTickerDataUri(hostUrl, ['MSFT'], '20150108', '20160102'),
            ];

            expect(generatedUrl.sort()).to.deep.equal(expected.sort());
        });

    });

});