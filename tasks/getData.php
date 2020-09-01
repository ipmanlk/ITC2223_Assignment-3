<?php
// get parameters
$required_parameters = array("startDatetime", "endDatetime", "category");

$get_data = array();

// add each get parameter to $get_data array after sanitizing and empty checking
foreach ($required_parameters as $key) {
    if (isset($_GET[$key]) && !empty($_GET[$key])) {
        $get_data[$key] = trim(filter_var($_GET[$key], FILTER_SANITIZE_STRING));
    } else {
        sendError("Please provide data for " . $key . ".");
    }
}

// require database connection
require_once("../config/config.php");

$startDatetime = mysqli_real_escape_string($link, $get_data["startDatetime"]);
$endDatetime = mysqli_real_escape_string($link, $get_data["endDatetime"]);
$category = mysqli_real_escape_string($link, $get_data["category"]);

// query for selecting data
$sql = "SELECT $category, datetime FROM sensor_data WHERE datetime > '$startDatetime' AND datetime < '$endDatetime'";


// get result set
$result = mysqli_query($link, $sql);

// store output data
$data = array();

if (mysqli_num_rows($result) > 0) {
    // output data of each row
    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = array($category => $row[$category], "datetime" => $row["datetime"]);
    }
} else {
    sendError("No records found for given search parameters!.");
}

// send json data
echo json_encode(array("type" => "success", "data" => $data));


// close db connection
mysqli_close($link);

// send error msgs and exit script
function sendError($msg)
{
    die(json_encode(array("type" => "error", "msg" => $msg)));
}
?>