import { expect } from 'chai';
import { singleTickerJsonResp, multiTickerJsonResp } from '../../test/jsonResponseExample';

import { processQuandlJsonIDB } from './tickerDataProcessor';

describe('tickerDataProcessor test', () => {

    describe(`${processQuandlJsonIDB.name}`, () => {
        it('Process single ticker request json correctly', () => {
            const singleProcessResult = processQuandlJsonIDB(singleTickerJsonResp);
            expect(singleProcessResult).to.deep.equal({
                FB: [
                    { date: '20150102', ticker: 'FB', adj_open: +78.58.toFixed(2), adj_high: +78.93.toFixed(2), adj_low: +77.7.toFixed(2), adj_close: +78.45.toFixed(2), adj_volume: 18177475 },
                    { date: '20150105', ticker: 'FB', adj_open: +77.98.toFixed(2), adj_high: +79.2455.toFixed(2), adj_low: +76.86.toFixed(2), adj_close: +77.19.toFixed(2), adj_volume: 26452191 },
                    { date: '20150106', ticker: 'FB', adj_open: +77.23.toFixed(2), adj_high: +77.59.toFixed(2), adj_low: +75.365.toFixed(2), adj_close: +76.15.toFixed(2), adj_volume: 27399288 },
                    { date: '20150107', ticker: 'FB', adj_open: +76.76.toFixed(2), adj_high: +77.36.toFixed(2), adj_low:+ 75.82.toFixed(2), adj_close: +76.15.toFixed(2), adj_volume: 22045333 },
                ]
            });
        });

        it('Process multiple ticker request json correctly', () => {
            const multiProcessResult = processQuandlJsonIDB(multiTickerJsonResp);
            expect(multiProcessResult).to.deep.equal({
                FB: [
                    { date: '20150102', ticker: 'FB', adj_open: +78.58.toFixed(2), adj_high: +78.93.toFixed(2), adj_low: +77.7.toFixed(2), adj_close: +78.45.toFixed(2), adj_volume: 18177475 },
                    { date: '20150105', ticker: 'FB', adj_open: +77.98.toFixed(2), adj_high: +79.2455.toFixed(2), adj_low: +76.86.toFixed(2), adj_close: +77.19.toFixed(2), adj_volume: 26452191 },
                    { date: '20150106', ticker: 'FB', adj_open: +77.23.toFixed(2), adj_high: +77.59.toFixed(2), adj_low: +75.365.toFixed(2), adj_close: +76.15.toFixed(2), adj_volume: 27399288 },
                    { date: '20150107', ticker: 'FB', adj_open: +76.76.toFixed(2), adj_high: +77.36.toFixed(2), adj_low:+ 75.82.toFixed(2), adj_close: +76.15.toFixed(2), adj_volume: 22045333 },
                ],
                MSFT: [
                    { date: '20150102', ticker: 'MSFT', adj_open: +43.947628043932.toFixed(2), adj_high: +44.663448817901.toFixed(2), adj_low: +43.8346037112.toFixed(2), adj_close: +44.041814987875.toFixed(2), adj_volume: 27913852 },
                    { date: '20150105', ticker: 'MSFT', adj_open: +43.674485906497.toFixed(2), adj_high: +44.013558904692.toFixed(2), adj_low: +43.561461573765.toFixed(2), adj_close: +43.632101781722.toFixed(2), adj_volume: 39673865 },
                    { date: '20150106', ticker: 'MSFT', adj_open: +43.683904600891.toFixed(2), adj_high: +44.031454424042.toFixed(2), adj_low: +42.892734271767.toFixed(2), adj_close: +42.996339910105.toFixed(2), adj_volume: 36447854 },
                    { date: '20150107', ticker: 'MSFT', adj_open: +43.307156825118.toFixed(2), adj_high: +43.759254156045.toFixed(2), adj_low: +42.845640799796.toFixed(2), adj_close: +43.542624184976.toFixed(2), adj_volume: 29114061 },
                ]
            });
        });
    });
});