// Trips data, models, ajax calls, etc
//
dataTable_global = null;     // although this table is populated in timeline_initialize and it is mainly used to store the timeline data, we are essentially using it as a list of all trips at other places too... e.g. it's used in map_initialize. So it makes more sense to put it here although we should probably think of using an alternative structure since this is mostly associated with the timeline
trip_id_global = null;       // current trip to be edited; this is changed in onEdit and used in location_prompt

function get_trips_for_map(callback) { // TODO perhaps merge with timeline one?
    $.ajax({
        'url' : get_trips_url_global,
        'type' : 'GET',
        'dataType' : 'json',
        'data' : {},
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t fetch trips for map...');
        } 
    });
}

function get_trips_for_timeline(callback) { // TODO perhaps merge with map one?
    $.ajax({
        'url' : get_trips_url_global, 
        'type' : 'GET',
        'dataType' : 'json',
        'data' : {},
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t fetch trips...');
        }
    });
}

function change_dates(trip_id, start_datetime, end_datetime) { // note dates must be in appropriate format
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

function delete_trip(trip_id, callback) {
    $.ajax({
        'url' : 'delete_trip/' + trip_id,  // TODO {{ url_for(...
        'type' : 'GET',
        'dataType' : 'json',
        'success' : callback, 
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t delete the trip...');
        }
    });
}

function add_trip(form_data, callback) {
    $.ajax({
        'url' : 'add_trip',   // TODO {{ url_for... }} but can't really
        'type' : 'POST',
        'dataType' : 'json',
        'data' : form_data,
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t add trip...');
        }
    });
}

function edit_trip(trip_id, form_data, callback) {
    $.ajax({
        'url' : 'edit_trip/' + trip_id,   // TODO {{ url_for... }} but can't really
        'type' : 'POST',
        'dataType' : 'json',
        'data' : form_data,
        'success' : editTripSuccess,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t edit trip...');
        }
    });
}
