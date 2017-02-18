# This script requires pandas library
# to install: pip install pandas

import pandas as pd

def process_wiki_quandl_metadata():
    """
    Process quandl wiki dataset for stock metadata
    to output list of available tickers in the API

    sources: 
        Metadata info: https://www.quandl.com/data/WIKI-Wiki-EOD-Stock-Prices/documentation/metadata
        Link to get full csv list: https://www.quandl.com/api/v3/databases/WIKI/codes?api_key=WCQgfrbePtWCWzoooSjz
    """
    
    def read_and_process_csv():
        """
        Read local raw csv file from quandl metadata
        and do string processing (removal) from the csv
        returning the Pandas.DataFrame of processed metadata
        """
        source_path = "WIKI-datasets-codes.csv"
        source = pd.read_csv(source_path, names=["Ticker", "Description"])

        # remove ticker WIKI prefix
        source['Ticker'] = source['Ticker'].map(lambda x: x.lstrip('WIKI/'))

        # remove anything in description except full name of the company
        # and remove untitled
        def filter_only_ticker_fullname(row):
            if "Untitled" in row:
                return ""
            else:
                return row.rsplit('(', 1)[0]

        source['Description'] = source['Description'].map(filter_only_ticker_fullname)
        
        # sort the values
        source = source.sort_values(['Ticker'], ascending=[True])

        # remove empty row
        source = source.drop(source[source['Ticker'] == ""].index)

        return source

    def output_json(source):
        """
        Outputting 2 different json files
        one with Ticker abbreviation and Ticker full name
        and the other just Ticker abbreviation and Ticker abbreviation
        """
        ticker_abbrv_long_json_path = "./ticker_abbrv_long_list.json"
        ticker_abbrv_abbrv_json_path = "./ticker_abbrv_abbrv_list.json"
        ticker_abbrvlong_long_json_path = "./ticker_abbrvlong_long_list.json"

        # rename header to be useful for app
        source2 = source.rename(columns={'Ticker': 'label', 'Description': 'value'})

        # do short abbrev as label and description as value
        source2.to_json(ticker_abbrv_long_json_path, orient='records')

        # do short abbrev only as label and key
        source3 = source2.copy()
        source3['value'] = source3['label']
        source3.to_json(ticker_abbrv_abbrv_json_path, orient='records')

        # do combined abbrev and fullname as label
        source4 = source2.copy()
        source4['label'] = source4['label'] + " - " + source4['value']
        source4.to_json(ticker_abbrvlong_long_json_path, orient='records')
        
    # execute the nested functions
    output_json(read_and_process_csv())
    
# do the processing
process_wiki_quandl_metadata()