/**
 * These are examples of json response received from Quandl API
 * 
 */

export const singleTickerJsonResp = {
    datatable: {
        data: [
            [
                "FB",
                "2015-01-02",
                78.58,
                78.93,
                77.7,
                78.45,
                18177475,
                0,
                1,
                78.58,
                78.93,
                77.7,
                78.45,
                18177475
            ],
            [
                "FB",
                "2015-01-05",
                77.98,
                79.2455,
                76.86,
                77.19,
                26452191,
                0,
                1,
                77.98,
                79.2455,
                76.86,
                77.19,
                26452191
            ],
            [
                "FB",
                "2015-01-06",
                77.23,
                77.59,
                75.365,
                76.15,
                27399288,
                0,
                1,
                77.23,
                77.59,
                75.365,
                76.15,
                27399288
            ],
            [
                "FB",
                "2015-01-07",
                76.76,
                77.36,
                75.82,
                76.15,
                22045333,
                0,
                1,
                76.76,
                77.36,
                75.82,
                76.15,
                22045333
            ]
        ],
        columns: [
            {
                name: "ticker",
                type: "String"
            },
            {
                name: "date",
                type: "Date"
            },
            {
                name: "open",
                type: "BigDecimal(34,12)"
            },
            {
                name: "high",
                type: "BigDecimal(34,12)"
            },
            {
                name: "low",
                type: "BigDecimal(34,12)"
            },
            {
                name: "close",
                type: "BigDecimal(34,12)"
            },
            {
                name: "volume",
                type: "BigDecimal(37,15)"
            },
            {
                name: "ex-dividend",
                type: "BigDecimal(42,20)"
            },
            {
                name: "split_ratio",
                type: "BigDecimal(40,18)"
            },
            {
                name: "adj_open",
                type: "BigDecimal(50,28)"
            },
            {
                name: "adj_high",
                type: "BigDecimal(50,28)"
            },
            {
                name: "adj_low",
                type: "BigDecimal(50,28)"
            },
            {
                name: "adj_close",
                type: "BigDecimal(50,28)"
            },
            {
                name: "adj_volume",
                type: "double"
            }
        ]
    },
    meta: {
        next_cursor_id: null
    }
};

export const multiTickerJsonResp = {
    datatable: {
        data: [
            [
                "FB",
                "2015-01-02",
                78.58,
                78.93,
                77.7,
                78.45,
                18177475,
                0,
                1,
                78.58,
                78.93,
                77.7,
                78.45,
                18177475
            ],
            [
                "FB",
                "2015-01-05",
                77.98,
                79.2455,
                76.86,
                77.19,
                26452191,
                0,
                1,
                77.98,
                79.2455,
                76.86,
                77.19,
                26452191
            ],
            [
                "FB",
                "2015-01-06",
                77.23,
                77.59,
                75.365,
                76.15,
                27399288,
                0,
                1,
                77.23,
                77.59,
                75.365,
                76.15,
                27399288
            ],
            [
                "FB",
                "2015-01-07",
                76.76,
                77.36,
                75.82,
                76.15,
                22045333,
                0,
                1,
                76.76,
                77.36,
                75.82,
                76.15,
                22045333
            ], [
                "MSFT",
                "2015-01-02",
                46.66,
                47.42,
                46.54,
                46.76,
                27913852,
                0,
                1,
                43.947628043932,
                44.663448817901,
                43.8346037112,
                44.041814987875,
                27913852
            ],
            [
                "MSFT",
                "2015-01-05",
                46.37,
                46.73,
                46.25,
                46.325,
                39673865,
                0,
                1,
                43.674485906497,
                44.013558904692,
                43.561461573765,
                43.632101781722,
                39673865
            ],
            [
                "MSFT",
                "2015-01-06",
                46.38,
                46.749,
                45.54,
                45.65,
                36447854,
                0,
                1,
                43.683904600891,
                44.031454424042,
                42.892734271767,
                42.996339910105,
                36447854
            ],
            [
                "MSFT",
                "2015-01-07",
                45.98,
                46.46,
                45.49,
                46.23,
                29114061,
                0,
                1,
                43.307156825118,
                43.759254156045,
                42.845640799796,
                43.542624184976,
                29114061
            ]
        ],
        columns: [
            {
                name: "ticker",
                type: "String"
            },
            {
                name: "date",
                type: "Date"
            },
            {
                name: "open",
                type: "BigDecimal(34,12)"
            },
            {
                name: "high",
                type: "BigDecimal(34,12)"
            },
            {
                name: "low",
                type: "BigDecimal(34,12)"
            },
            {
                name: "close",
                type: "BigDecimal(34,12)"
            },
            {
                name: "volume",
                type: "BigDecimal(37,15)"
            },
            {
                name: "ex-dividend",
                type: "BigDecimal(42,20)"
            },
            {
                name: "split_ratio",
                type: "BigDecimal(40,18)"
            },
            {
                name: "adj_open",
                type: "BigDecimal(50,28)"
            },
            {
                name: "adj_high",
                type: "BigDecimal(50,28)"
            },
            {
                name: "adj_low",
                type: "BigDecimal(50,28)"
            },
            {
                name: "adj_close",
                type: "BigDecimal(50,28)"
            },
            {
                name: "adj_volume",
                type: "double"
            }
        ]
    },
    meta: {
        next_cursor_id: null
    }
}