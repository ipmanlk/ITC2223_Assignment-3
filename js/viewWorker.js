// This worker accepts response data and returns google charts friendly rows and columns
onmessage = function (e) {
    const responseData = e.data;
    // build rows & columns array for google charts DataTable object using response data
    const columns = Object.keys(responseData[0]).filter(i => i !== "datetime");
    const rows = [];

    responseData.forEach(i => {
        const row = [];
        row.push(i["datetime"]);
        columns.forEach(column => row.push(parseFloat(i[column])));
        rows.push(row);
    });

    postMessage({rows, columns});
}