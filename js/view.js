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
            {
                "id": "txtStartDatetime",
                "regex": /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/,
                "error": "Please select a valid start date & time!."
            },
            {
                "id": "txtEndDatetime",
                "regex": /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/,
                "error": "Please select an end date & time!."
            },
            {
                "id": "cmbCategories",
                "regex": /.+/,
                "error": "Please select a category!."
            }
        ];

        for (let vi of validationInfo) {

            // get form input value, if null set it to "";
            let value = $(`#${vi.id}`).val();
            if (value == null) value = "";

            // test with regex for errors
            if (!vi.regex.test(value)) {
                showOutputMsg(vi.error, "danger");
                return;
            }
        }

        loadChart();
    });
}

function loadChart() {
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
    });

    // when request is completed
    request.done(function (response) {

        // check if server returned any errors
        if (response.type != "success") {
            showOutputMsg(response.msg, "danger");
            return;
        }

        /* Note
        Since server returns a large number of records, web worker (seperate thread) is used to minimize
        UI lagging.
        */

        // check if browser has web worker support
        if (window.Worker) {
            const viewWorker = new Worker("./js/viewWorker.js"); // create new worker instance
            viewWorker.postMessage(response.data); // send response data to worker

            // when worker sends back response data after processing (as rows and columns for google chart)
            viewWorker.onmessage = function (e) {
                showChart(e.data.rows, e.data.columns);
            }
        } else {
            window.alert("Your browser doesn\'t support web workers.");
        }
    });

    // when server is unreachable or request failed
    request.fail(function () {
        showOutputMsg("Unable to contact the server!", "danger");

    });

    // after request, always run
    request.always(function () {
        // enable view chart button
        $("#btnViewChart").attr("disabled", false);
    });
}

// render chart using google charts library
function showChart(rows, columns) {

    // load neccessary google charts packages
    google.charts.load("current", { "packages": ["corechart"] });

    // callback function to render chart after onLoad completed
    function drawChart() {
        // define chart to be drawn using DataTable object
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

        // instantiate and draw the chart
        const chart = new google.visualization.LineChart(document.getElementById("outputChart"));
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