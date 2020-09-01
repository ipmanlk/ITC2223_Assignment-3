<?php
// get parameters
$required_parameters = array("startDatetime", "endDatetime", "categories");

// check required parameters are provided
if (!isset($_GET["startDatetime"]) && empty($_GET["startDatetime"])) {
    send_error("Please provide a valid start date!.");
}

if (!isset($_GET["endDatetime"]) && empty($_GET["endDatetime"])) {
    send_error("Please provide a valid end date!.");
}

if (!isset($_GET["categories"])) {
    send_error("Please provide valid categories!.");
}

// require database connection
require_once("../config/config.php");

// assign recieved values to variables
$startDatetime = mysqli_real_escape_string($link, $_GET["startDatetime"]);
$endDatetime = mysqli_real_escape_string($link, $_GET["endDatetime"]);
$categories = $_GET["categories"];
$categoriesString = mysqli_real_escape_string($link, implode(",", $_GET["categories"]));

// query for selecting data
$sql = "SELECT $categoriesString, datetime FROM sensor_data WHERE datetime > '$startDatetime' AND datetime < '$endDatetime'";

// get result set
$result = mysqli_query($link, $sql);

// store entries for google chart data table
$data_table_rows = array();

if (mysqli_num_rows($result) > 0) {
    // output data of each row
    while ($row = mysqli_fetch_assoc($result)) {
        $entry = array(
            "datetime" => $row["datetime"]
        );

        // add category values to entry in order 
        foreach ($categories as $category) {
            $entry[$category] = $row[$category];
        }

        // push to data table rows array
        array_push($data_table_rows, $entry);
    }
} else {
    send_error("No records found for given search parameters!.");
}

// send json data
echo json_encode(array("type" => "success", "data" => $data_table_rows));

// close db connection
mysqli_close($link);

// send error msgs and exit script
function send_error($msg)
{
    die(json_encode(array("type" => "error", "msg" => $msg)));
}

?>