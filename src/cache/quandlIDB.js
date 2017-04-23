import StockIDB from './stockIDB';

const QuandlIDB = {
    init() {
        StockIDB.init();

        putMiddleware = (next) => (tickerData) => {
            tickerData.push({ date: "20170109", ticker: 'AMZN', open: -1, close: -1 });

            return next(tickerData);
            // return new Promise((resolve, reject) => {
            //     next(tickerData).then((putResult) => {
            //         resolve(putResult);
            //     }).catch(error => {
            //         reject(error);
            //     });
            // });
        };

        StockIDB.applyMiddleware({
            functionName: 'putTickerData',
            middlewares: putMiddleware
        });
    }
};

export default QuandlIDB;