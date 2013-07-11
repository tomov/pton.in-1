// Trips data, models, ajax calls, etc
//
// Global variables:
//
// get_events_url_global           // api endpoint ; defined in HTML to make use of url_for(...)
// events_data_global              // all events fetched by backend -- stored for filtering in the feed ;; do not declare here b/c it gets populated elsewhere...
// event_id_global                 // current event to be edited; this is changed in onEdit and used in event_prompt 

function get_events_success(data, textStatus, jqXHR) {
    // initialize data structures that represent trips (i.e. feed) once we have fetched them
    console.log(data);
    events_data_global = data;
    populate_map_with_events(events_data_global);
    populate_feed_with_events(events_data_global);
}

function get_events(callback) {
    $.ajax({
        'url' : get_events_url_global,
        'type' : 'GET',
        'dataType' : 'json',
        'data' : {},
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t fetch events for map...');
        } 
    });
}

// TODO implement
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

function set_event_rsvp(event_id, rsvp_status, callback) {
    $.ajax({
        'url' : 'set_event_rsvp/' + event_id + '/' + rsvp_status,  // TODO {{ url_for(...
        'type' : 'GET',
        'dataType' : 'json',
        'success' : callback, 
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t delete the event...');
        }
    });    
}

