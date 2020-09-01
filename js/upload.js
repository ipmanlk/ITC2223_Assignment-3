$(document).ready(initialize);

// global reference for file input
const fileSensorData = document.getElementById("fileSensorData");

function initialize() {
    // register event listeners
    $("#uploadForm").on("submit", function (e) {
        e.preventDefault();
        hideOutputMsg();

        // check if a file is selected
        if (!fileSensorData.files[0]) {
            showOutputMsg("Please select a file first!", "danger");
            return;
        }

        uploadCSV();
    });
}

// upload csv file to the server
function uploadCSV() {

    // create form data object to send the file
    const data = new FormData();

    // append file to the form data object
    data.append("sensorData", fileSensorData.files[0]);

    // show please be patient wait msg
    showOutputMsg("Please be patient. Server is processing the file..... <img src='./img/loading.gif' class='loading-spinner'/>");

    // disable upload button (to prevent multiple requests)
    $("#btnUpload").attr("disabled", true);

    // start new http request
    const request = $.ajax({
        url: "./tasks/saveData.php",
        method: "POST",
        cache: false,
        timeout: 300000,
        contentType: false,
        processData: false,
        dataType: "json",
        data: data

    }).done(function (response) { // after request is completed
        if (response.type == "success") {
            showOutputMsg(response.msg, "success");
        } else {
            showOutputMsg(response.msg, "danger");
        }

        // reset the form
        $("#uploadForm").trigger("reset");

    }).fail(function () { // when server is unreachable or request failed
        showOutputMsg("Unable to contact the server!", "danger");

    }).always(function () {  // after request always run
        // enable upload button
        $("#btnUpload").attr("disabled", false);
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