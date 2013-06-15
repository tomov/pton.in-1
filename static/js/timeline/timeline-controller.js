TIMELINE_ROW_HEIGHT = 46.5; // TODO find more legit way to figure it out...
TIMELINE_PEOPLE_LIMIT = 10;         // how many trips to show by default -- this is to speed up zooming / loading
show_all_trips_in_timeline_global = false;

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
    // update the date times in table for the edit prompt
    realRow = dataView_global.getViewRows()[row];
    start_date = print_date(new Date(start_datetime * 1000));
    end_date = print_date(new Date(end_datetime * 1000));
    dataTable_global.setValue(row, 12, start_date);
    dataTable_global.setValue(row, 13, end_date);
    change_dates(trip_id, start_datetime, end_datetime);
}

function onDelete() {
    var data = dataView_global;
    var row = getSelectedRow();
    if (row == undefined) return;
    var trip_id = data.getValue(row, 15);
    delete_trip(trip_id, null);
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
    var row = getSelectedRow();
    if (row == undefined) return;
    populateFormFromDataTable(dataView_global, row);
    showEditTripPrompt();
};

var onNew = function () {
    showAddTripPrompt();
};

function onReady() {
    htmltooltip.render();
}
