<?php
// check post data is set
if (!isset($_FILES["sensorData"])) {
    sendError("Please provide a CSV file!.");
}

// check if provided file is a csv
$mimes = array("application/vnd.ms-excel", "text/plain", "text/csv", "text/tsv"); //meme types for csv

if (!in_array($_FILES["sensorData"]["type"], $mimes)) {
    sendError("Please select a valid .csv file");
}

// require database connection
require_once("../config/config.php");

// clear existing records (if there are any) - to prevent duplicates
$sql = "TRUNCATE TABLE sensor_data";

if (!mysqli_query($link, $sql)) {
    sendError(mysqli_error($link));
}

// import data from csv
if (($handle = fopen($_FILES["sensorData"]["tmp_name"], "r")) !== FALSE) {
    fgetcsv($handle); // skip first row (column names)

    // loop through each row
    while (($row = fgetcsv($handle)) !== FALSE) {
        $datetime = mysqli_real_escape_string($link, $row[0]);
        $power = mysqli_real_escape_string($link, $row[1]);
        $temp = mysqli_real_escape_string($link, $row[2]);
        $humidity = mysqli_real_escape_string($link, $row[3]);
        $light = mysqli_real_escape_string($link, $row[4]);
        $co2 = mysqli_real_escape_string($link, $row[5]);
        $dust = mysqli_real_escape_string($link, $row[6]);

        // ignore empty rows
        if (trim($datetime . $power . $temp . $humidity . $light . $co2 . $dust) == "") {
            continue;
        }

        // insert into the database
        $sql = "INSERT INTO sensor_data(power,temp,humidity,light,co2,dust,datetime) VALUES('$power', '$temp', '$humidity', '$light', '$co2', '$dust', '$datetime')";

        if (!mysqli_query($link, $sql)) {
            sendError(mysqli_error($link));
        }
    }

    // close file
    fclose($handle);

    // close db connection
    mysqli_close($link);

    // send success msg
    echo json_encode(array("type" => "success", "msg" => "CSV file has been imported successfully!."));
}

// send error msgs and exit script
function sendError($msg)
{
    die(json_encode(array("type" => "error", "msg" => $msg)));
}
?>