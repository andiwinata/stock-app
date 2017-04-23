import createStockIDB, { applyMiddleware } from './stockIDB';

export default function createQuandlIDB(overrider) {
    let quandlIDBInstance = null;

    function _init() {
        const putMiddleware = (next) => (tickerData) => {
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

        const overrider = applyMiddleware({
            functionName: 'putTickerData',
            middlewares: putMiddleware
        });

        quandlIDBInstance = createStockIDB(overrider);
    };

    _init();

    if (overrider) {
        return overrider(quandlIDBInstance);
    }

    return quandlIDBInstance;
};

export default QuandlIDB;