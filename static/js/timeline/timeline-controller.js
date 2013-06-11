function getRandomName() {
    var names = ["Algie", "Barney", "Grant", "Mick", "Langdon"];

    var r = Math.round(Math.random() * (names.length - 1));
    return names[r];
}

// when we zoom the map, the timeline shows only the trips that are visible on the map
function onZoom(bounds) {
    // create array for viewable rows
    save_rows = [];
 
    // currently iterates through list... should prolly change to a 2d-tree or something evetually
    for (var j=0;j<markers.length;j++) {
        if (bounds.contains(markers[j].getPosition())) {
            // add row if in bounds
            save_rows.push(j);
        }
    }

    dataView_global.setRows(save_rows);
    timeline.draw(dataView_global);
    htmltooltip.render();
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
    var data = dataView_global;
    var row = getSelectedRow();
    if (row == undefined) return;
    var change_dates_link = data.getValue(row, 16);
    var start_datetime = data.getValue(row, 0);
    var end_datetime = data.getValue(row, 1);
    start_datetime = Date.parse(start_datetime) / 1000;
    end_datetime = Date.parse(end_datetime) / 1000; // it's milliseconds... convert to unix timestamp, so on python side we can convert from unix timestamp to mysql datetime
    // update the date times for the showTripBox thing
    realRow = dataView_global.getViewRows()[row];
    start_date = print_date(new Date(start_datetime * 1000));
    end_date = print_date(new Date(end_datetime * 1000));
    dataTable_global.setValue(row, 12, start_date);
    dataTable_global.setValue(row, 13, end_date);
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
    var data = dataView_global;
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
    var data = dataView_global; 
    var row = getSelectedRow();
    if (row == undefined) return;
    var link = data.getValue(row, 7);
    var is_mine = data.getValue(row, 8);
    if (link && !is_mine) {
        // someone else and she's looking for roommates/housing
        // => open email
        window.open(link, '_blank');
    } else if (is_mine) {
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
    var data = dataView_global;
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
