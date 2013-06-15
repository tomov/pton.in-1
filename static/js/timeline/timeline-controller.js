TIMELINE_ROW_HEIGHT = 46.5; // TODO find more legit way to figure it out...
TIMELINE_PEOPLE_LIMIT = 10;         // how many trips to show by default -- this is to speed up zooming / loading
show_all_trips_in_timeline_global = false;
trip_id_global = -1;       // current trip to be edited; this is changed in onEdit and used in location_prompt

// when we zoom the map, the timeline shows only the trips that are visible on the map
function onZoom(bounds) {
    if (typeof markers_global === 'undefined' || typeof timeline === 'undefined') {
        // onZoom sometimes gets called before the timeline / map has loaded
        return;
    }
    // count how many people will be visible
    // note that this relies on the fact that trips for the same person appear one after the other in the dataTable
    var last_group = "";
    var people_count = 0;
    // create array for viewable rows
    var save_rows = [];
    // currently iterates through list... should prolly change to a 2d-tree or something evetually
    for (var j=0;j<markers_global.length;j++) {
        if (bounds.contains(markers_global[j].getPosition())) {
            // break early if we can -- speeds things up
            // TODO might not be necessary tho... and we can probs use save_rows.length instead of people_count since we only need an overestimate... look into it
            group = dataTable_global.getValue(j, 3);
            if (group != last_group) {
                people_count++;
                last_group = group;
            }
            if (!show_all_trips_in_timeline_global && people_count > TIMELINE_PEOPLE_LIMIT) {
                people_count--;
                break;
            }
            // add row if in bounds
            save_rows.push(j);
        }
    }
    dataView_global.setRows(save_rows);
    updateTimelineHeight(people_count);
    timeline.draw(dataView_global);
    updateTimelineHeight();
}

function updateTimelineHeight(row_count) {
    if (typeof row_count === 'undefined') {
       row_count = timeline.groups.length; // it's kind of catch 22 -- timeline.groups becomes updated after we call timeline.draw, but timeline.draw draws to fit its container which we must first resize here... 
       // so what we do is the following: resize the container first to something at least as big as what we expect it to be, draw the timeline, then resize container again. Kinda toolish but works 
    }
    if (!show_all_trips_in_timeline_global) {
        if (row_count > TIMELINE_PEOPLE_LIMIT) {
            row_count = TIMELINE_PEOPLE_LIMIT;
        }
    }
    var height = (row_count + 1) * TIMELINE_ROW_HEIGHT;
    $("#mytimeline").css('height', height);
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

// print Date object in format convenient for the form calendar for editing the trip (i.e. the prompt)
function print_date(date) {
    var str = (date.getMonth() + 1).toString() + '/' + date.getDate() + '/' + date.getFullYear();
    return str;
}

function onChange() {
    var data = dataView_global;
    var row = getSelectedRow();
    if (row == undefined) return;
    var trip_id = data.getValue(row, 15);
    var start_datetime = data.getValue(row, 0);
    var end_datetime = data.getValue(row, 1);
    start_datetime = Date.parse(start_datetime) / 1000;
    end_datetime = Date.parse(end_datetime) / 1000; // it's milliseconds... convert to unix timestamp, so on python side we can convert from unix timestamp to mysql datetime
    // update the date times for the prompt
    realRow = dataView_global.getViewRows()[row];
    start_date = print_date(new Date(start_datetime * 1000));
    end_date = print_date(new Date(end_datetime * 1000));
    dataTable_global.setValue(row, 12, start_date);
    dataTable_global.setValue(row, 13, end_date);
    $.ajax({
        'url' : 'change_dates/' + trip_id, // TODO {{ url_for(...
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
    var trip_id = data.getValue(row, 15);
    $.ajax({
        'url' : 'delete_trip/' + trip_id,  // TODO {{ url_for(...
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

var onEdit = function (event) {
    var data = dataView_global;
    var row = getSelectedRow();
    if (row == undefined) return;
    var location_name = data.getValue(row, 9);
    var start_date = data.getValue(row, 12);
    var end_date = data.getValue(row, 13);
    var doing_what = data.getValue(row, 5);
    var comment = data.getValue(row, 6);
    var location_lat = data.getValue(row, 10);
    var location_long = data.getValue(row, 11);
    trip_id_global = data.getValue(row, 15); // this is crucial for the form to work
    $('#location_name').val(location_name);
    $('#doing_what').val(doing_what);
    $('#start_date').val(start_date);
    $('#end_date').val(end_date);
    $('#comment').val(comment);
    $('#location_lat').val(location_lat);
    $('#location_long').val(location_long);
    showEditTripPrompt();
};

var onNew = function () {
    showAddTripPrompt();
};

function onReady() {
    htmltooltip.render();
}
