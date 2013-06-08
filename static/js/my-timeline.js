google.load("visualization", "1");

// Set callback to run when API is loaded
google.setOnLoadCallback(drawVisualization);

// Called when the Visualization API is loaded.
// TODO: this is where this is supposed to be
// but then it's hard to talk to the backend
function drawVisualization() {
    // Create and populate a data table.
    /*
    Momchil: we're generating this in app_content.html
    to make use of Jinja and populate with Flask data

    data = new google.visualization.DataTable();
    data.addColumn('datetime', 'start');
    data.addColumn('datetime', 'end');
    data.addColumn('string', 'content');
    data.addColumn('string', 'group');
    data.addColumn('string', 'className');

    // create some random data
    var names = ["Algie", "Barney", "Chris"];
    for (var n = 0, len = names.length; n < len; n++) {
        var name = names[n];
        var now = new Date();
        var end = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        for (var i = 0; i < 5; i++) {
            var start = new Date(end.getTime() + Math.round(Math.random() * 5) * 60 * 60 * 1000);
            var end = new Date(start.getTime() + Math.round(4 + Math.random() * 5) * 60 * 60 * 1000);

            var r = Math.round(Math.random() * 2);
            var availability = (r === 0 ? "Unavailable" : (r === 1 ? "Available" : "Maybe"));
            var group = availability.toLowerCase();
            var content = availability;
            data.addRow([start, end, content, name, group]);
        }
    }
    */

    // specify options
    var options = {
        width:  "100%",
        height: "99%",
        layout: "box",
        axisOnTop: true,
        eventMargin: 10,  // minimal margin between events
        eventMarginAxis: 0, // minimal margin beteen events and the axis
        editable: true,
        showNavigation: true
    };

    // Instantiate our timeline object.
    timeline = new links.Timeline(document.getElementById('mytimeline'));

    // register event listeners
    google.visualization.events.addListener(timeline, 'edit', onEdit);
    google.visualization.events.addListener(timeline, 'delete', onDelete);
    google.visualization.events.addListener(timeline, 'select', onSelect);
    google.visualization.events.addListener(timeline, 'ready', onReady);
    google.visualization.events.addListener(timeline, 'add', onNew);
    google.visualization.events.addListener(timeline, 'change', onChange);

    // Draw our timeline with the created data and options
    timeline.draw(dataView, options);
    timeline.setRealData(dataTable);

    // Set a customized visible range
    var start = new Date(2013, 4, 15);
    var end = new Date(2013, 8, 15);
    timeline.setVisibleChartRange(start, end);
}

function getRandomName() {
    var names = ["Algie", "Barney", "Grant", "Mick", "Langdon"];

    var r = Math.round(Math.random() * (names.length - 1));
    return names[r];
}

function getSelectedRow() {
    var row = undefined;
    var sel = timeline.getSelection();
    if (sel.length) {
        if (sel[0].row != undefined) {
            row = sel[0].row;
        }
    }
    return row;
}

// print Date object in format convenient for the form calendar for editing the trip (i.e. showTripBox)
function print_date(date) {
    var str = (date.getMonth() + 1).toString() + '/' + date.getDate() + '/' + date.getFullYear();
    return str;
}

function onChange() {
    var data = dataView;
    var row = getSelectedRow();
    if (row == undefined) return;
    var change_dates_link = data.getValue(row, 16);
    var start_datetime = data.getValue(row, 0);
    var end_datetime = data.getValue(row, 1);
    start_datetime = Date.parse(start_datetime) / 1000;
    end_datetime = Date.parse(end_datetime) / 1000; // it's milliseconds... convert to unix timestamp, so on python side we can convert from unix timestamp to mysql datetime
    // update the date times for the showTripBox thing
    realRow = dataView.getViewRows()[row];
    start_date = print_date(new Date(start_datetime * 1000));
    end_date = print_date(new Date(end_datetime * 1000));
    dataTable.setValue(row, 12, start_date);
    dataTable.setValue(row, 13, end_date);
    $.ajax({
        'url' : change_dates_link,
        'type' : 'GET',
        'dataType' : 'json',
        'data' : {
            'start_date': start_datetime,
            'end_date': end_datetime
        },
        'success' : function(data, textStatus, jqXHR) {
            // alert('Trip changed successfully!');
        },
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t update the trip...');
        }
    });
 
}

function onDelete() {
    var data = dataView;
    var row = getSelectedRow();
    if (row == undefined) return;
    var delete_link = data.getValue(row, 15);
    $.ajax({
        'url' : delete_link,
        'type' : 'GET',
        'dataType' : 'json',
        'success' : function(data, textStatus, jqXHR) {
            // alert('Trip deleted successfully!');
        },
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t delete the trip...');
        }
    });
}

function onSelect() {
    var data = dataView; 
    var row = getSelectedRow();
    if (row == undefined) return;
    var link = data.getValue(row, 7);
    var is_mine = data.getValue(row, 8);
    if (link && is_mine == 'False') {
        // someone else and she's looking for roommates/housing
        // => open email
        window.open(link, '_blank');
    } else if (is_mine == 'True') {
        // pop up edit box -- handled in onEdit
    }
}

function strip(html)
{
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent||tmp.innerText;
}

// Make a callback function for the select event
var onEdit = function (event) {
    var data = dataView;
    var row = getSelectedRow();
    if (row == undefined) return;
    // it's my tab => edit it
    // note in this case, link has completely different meaning
    var link = data.getValue(row, 7);
    $('#populate_form').attr('action', link);
    var location_name = data.getValue(row, 9);
    var start_date = data.getValue(row, 12);
    var end_date = data.getValue(row, 13);
    var doing_what = data.getValue(row, 5);
    var comment = data.getValue(row, 6);
    var location_lat = data.getValue(row, 10);
    var location_long = data.getValue(row, 11);
    var delete_link = data.getValue(row, 15);
    $('#location_name').val(location_name);
    $('#doing_what').val(doing_what);
    $('#start_date').val(start_date);
    $('#end_date').val(end_date);
    $('#comment').val(comment);
    $('#location_lat').val(location_lat);
    $('#location_long').val(location_long);
    $('#delete-trip-button').show();
    $('#delete-form').attr('action', delete_link + '/1'); // call the redirect-version of delete (see delete_trip in application.py)
    showTripBox();
    /*
    // historic -- from example
    var row = getSelectedRow();
    var content = data.getValue(row, 2);
    var availability = strip(content);
    var newAvailability = prompt("Enter status\n\n" +
            "Choose from: Available, Unavailable, Maybe", availability);
    if (newAvailability != undefined) {
        var newContent = newAvailability;
        data.setValue(row, 2, newContent);
        data.setValue(row, 4, newAvailability.toLowerCase());
        timeline.draw(view);
    }*/
};

var onNew = function () {
    clearTripBox();
    showTripBox();
};

function onReady() {
    htmltooltip.render();
}
