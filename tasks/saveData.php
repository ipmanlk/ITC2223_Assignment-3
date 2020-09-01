<?php
// check post data is set
if (!isset($_FILES["sensorData"]) || !isset($_POST["clearRecords"])) {
    send_error("Please provide a CSV file and 'true' or 'false' value for clearRecords!.");
}

// check if provided file is a csv
$mimes = array("application/vnd.ms-excel", "text/plain", "text/csv", "text/tsv"); //meme types for csv

if (!in_array($_FILES["sensorData"]["type"], $mimes)) {
    send_error("Please select a valid .csv file");
}

// check clear records value is valid
$clear_records = $_POST["clearRecords"];
if ($clear_records != "true" && $clear_records != "false") {
    send_error("Please provide a valid value for clearRecords!.");
}

// assign boolean value for clear records
$clear_records = ($_POST["clearRecords"] == "true") ? true : false;

// require database connection
require_once("../config/config.php");

if ($clear_records == true) {
    // clear existing records (if there are any)
    $sql = "TRUNCATE TABLE sensor_data";

    if (!mysqli_query($link, $sql)) {
        send_error(mysqli_error($link));
    }
}

$values = ""; // store value sets (rows) for SQL insert statement
$current_count = 0; // current row count in $values
$insert_limit = 10000; // how many records (rows) should be inserted at once

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

        // append to $values string for insert statement
        $values .= "('$power', '$temp', '$humidity', '$light', '$co2', '$dust', '$datetime'),";

        // increment current count
        $current_count++;

        // when current count is same as insert limit, run sql insert query
        if ($current_count == $insert_limit) {
            insert_to_table($link, $values);
            $current_count = 0; // reset current count
            $values = ""; // clear value string
        }
    }

    // if there are values left to insert
    if ($values != "") {
        insert_to_table($link, $values);
    }

    // close file
    fclose($handle);

    // close db connection
    mysqli_close($link);

    // send success msg
    echo json_encode(array("type" => "success", "msg" => "CSV file has been imported successfully!."));
}

function insert_to_table($link, $values)
{
    // remove last comma
    $values = substr($values, 0, -1);;

    // insert into the database
    $sql = "INSERT INTO sensor_data(power,temp,humidity,light,co2,dust,datetime) VALUES $values";

    // run mysql query and if failed, send error to client
    if (!mysqli_query($link, $sql)) {
        send_error(mysqli_error($link));
    }
}

// send error msgs and exit script
function send_error($msg)
{
    die(json_encode(array("type" => "error", "msg" => $msg)));
}
