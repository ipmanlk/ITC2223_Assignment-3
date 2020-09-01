$(document).ready(initialize);

function initialize() {
    // init datetime pickers
    $("#txtStartDatetime").datetimepicker();
    $("#txtEndDatetime").datetimepicker();

    // init bootstrap select
    $("#cmbCategories").selectpicker();

    // register event listeners
    $("#viewForm").on("submit", function (e) {
        e.preventDefault();
        hideOutputMsg();

        // object with validation regex and error msg for each form input
        const validationInfo = [
            { "id": "txtStartDatetime", "regex": /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/, "error": "Please select a valid start date & time!." },
            { "id": "txtEndDatetime", "regex": /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/, "error": "Please select an end date & time!." },
            { "id": "cmbCategories", "regex": /.+/, "error": "Please select a category!." }
        ];

        for (let vi of validationInfo) {

            // get form value, if null set to "";
            let value = $(`#${vi.id}`).val();
            if (value == null) value = "";

            // test with regex
            if (!vi.regex.test(value)) {
                showOutputMsg(vi.error, "danger");
                return;
            }
        }

        getChartData();
    });
}

// get chart data from the server
function getChartData() {
    // disable view chart button (to prevent multiple requests)
    $("#btnViewChart").attr("disabled", true);

    // create new http request using jquery ajax & bind form data
    const request = $.ajax({
        url: "./tasks/getData.php",
        method: "GET",
        dataType: "json",
        data: {
            startDatetime: $("#txtStartDatetime").val(),
            endDatetime: $("#txtEndDatetime").val(),
            categories: $("#cmbCategories").val(),
        }

    }).done(function (response) { // when request is completed
        if (response.type == "success") {
            showChart(response.data);
        } else {
            showOutputMsg(response.msg, "danger");
        }

    }).fail(function () { // when server is unreachable or request failed
        showOutputMsg("Unable to contact the server!", "danger");

    }).always(function () { // after request always run
        // enable view chart button
        $("#btnViewChart").attr("disabled", false);
    });
}

// render chart using received data and google charts library
function showChart(responseData) {

    // build rows & columns array for google charts DataTable object using response data
    const columns = Object.keys(responseData[0]).filter(i => i !== "datetime");
    const rows = [];

    responseData.forEach(i => {
        const row = [];
        row.push(i["datetime"]);
        columns.forEach(column => row.push(parseFloat(i[column])));
        rows.push(row);
    });


    // load neccessary google charts packages
    google.charts.load("current", { "packages": ["corechart"] });

    // callback function to render chart after onLoad completed
    function drawChart() {
        // define chart to be drawn
        const data = new google.visualization.DataTable();

        // add date & time column
        data.addColumn("string", "Date & Time");

        // add other category columns such as co2
        columns.forEach(column => {
            // find full text in relevent option for the current column
            const fullColumnName = $(`#cmbCategories option[value='${column}']`).text();
            data.addColumn("number", fullColumnName);
        });

        // add rows created beforehand
        data.addRows(rows);

        // chart options
        const options = {
            hAxis: {
                title: "Date & Time"
            },
            vAxis: {
                title: "Values"
            },
            width: "100%",
            height: 700,
        };

        // Instantiate and draw the chart.
        var chart = new google.visualization.LineChart(document.getElementById("outputChart"));
        chart.draw(data, options);
    }

    // bind callback function to onLoad event
    google.charts.setOnLoadCallback(drawChart);

    // set event listener for window resize event to make chart responsive.
    $(window).off("resize"); // remove exisiting event listener (if any)

    $(window).resize(function () {
        drawChart();
    });
}

function showOutputMsg(msg, type = "primary") {
    const outputMsg = $("#outputMsg");
    outputMsg.removeClass();
    outputMsg.addClass(`alert alert-${type}`);
    outputMsg.html(msg);
    outputMsg.fadeIn();
}

function hideOutputMsg() {
    $("#outputMsg").hide();
}