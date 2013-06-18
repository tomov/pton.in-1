// Trips data, models, ajax calls, etc
//
event_id_global = null;       // current trip to be edited; this is changed in onEdit and used in trip_prompt 

// TODO implement
/*
function get_events_for_map(callback) { // TODO perhaps merge with timeline one?
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
*/

/*
function get_events_for_timeline(callback) { // TODO perhaps merge with map one?
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
*/

/*
function change_event_latlong(trip_id, location_lat, location_long) {
    $.ajax({
        'url' : 'change_latlong/' + trip_id, // TODO {{ url_for(...
        'type' : 'GET',
        'dataType' : 'json',
        'data' : {
            'location_lat': location_lat,
            'location_long': location_long
        },
        'success' : function(data, textStatus, jqXHR) {
            // alert('Trip changed successfully!');
        },
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t update the trip...');
        }
    });
}
*/

function delete_event(event_id, callback) {
    $.ajax({
        'url' : 'delete_event/' + event_id,  // TODO {{ url_for(...
        'type' : 'GET',
        'dataType' : 'json',
        'success' : callback, 
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t delete the event...');
        }
    });
}

function add_event(form_data, callback) {
    $.ajax({
        'url' : 'add_event',   // TODO {{ url_for... }} but can't really
        'type' : 'POST',
        'dataType' : 'json',
        'data' : form_data,
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t add event...');
        }
    });
}

function edit_event(event_id, form_data, callback) {
    $.ajax({
        'url' : 'edit_event/' + event_id,   // TODO {{ url_for... }} but can't really
        'type' : 'POST',
        'dataType' : 'json',
        'data' : form_data,
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t edit event...');
        }
    });
}
