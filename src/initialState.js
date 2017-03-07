import moment from 'moment';

export const initialSelectedDate = {
    startDate: moment().subtract(3, "weeks"),
    endDate: moment()
};

const isLocal = location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.protocol.startsWith('file:///');

const serverHost = isLocal ?
    "http://localhost:5000" : "https://stock-app-server.herokuapp.com/";

const initialState = {
    selectedTickers: [],
    selectedDate: initialSelectedDate,
    shownTickers: {},
    shownDate: {},
    apiKey: null, // to be passed to server if not null
    serverHost
}

export default initialState;