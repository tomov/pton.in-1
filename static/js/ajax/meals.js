// Trips data, models, ajax calls, etc
//
// Global variables:
//
// get_meals_url_global            // api endpoint ; defined in HTML to make use of url_for(...)
// meals_data_global               // all meals fetched by backend -- stored for filtering in the feed ;; do not declare here b/c it gets populated elsewhere...
// meal_id_global                  // current meal to be edited; this is changed in onEdit and used in meal_prompt 

function get_meals_success(data, textStatus, jqXHR) {
    // initialize data structures that represent trips (i.e. feed) once we have fetched them
    meals_data_global = data;
    populate_map_with_meals(meals_data_global);
    populate_feed_with_meals(meals_data_global);
}

function get_meals(callback) {
    $.ajax({
        'url' : get_meals_url_global,
        'type' : 'GET',
        'dataType' : 'json',
        'data' : {},
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t fetch meals for map...');
        } 
    });
}

// TODO implement
/*
function get_meals_for_timeline(callback) { // TODO perhaps merge with map one?
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
function change_meal_latlong(trip_id, location_lat, location_long) {
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

function delete_meal(meal_id, callback) {
    $.ajax({
        'url' : 'delete_meal/' + meal_id,  // TODO {{ url_for(...
        'type' : 'GET',
        'dataType' : 'json',
        'success' : callback, 
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t delete the meal...');
        }
    });
}

function add_meal(form_data, callback) {
    $.ajax({
        'url' : 'add_meal',   // TODO {{ url_for... }} but can't really
        'type' : 'POST',
        'dataType' : 'json',
        'data' : form_data,
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t add meal...');
        }
    });
}

function edit_meal(meal_id, form_data, callback) {
    $.ajax({
        'url' : 'edit_meal/' + meal_id,   // TODO {{ url_for... }} but can't really
        'type' : 'POST',
        'dataType' : 'json',
        'data' : form_data,
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t edit meal...');
        }
    });
}
