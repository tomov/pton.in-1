// stuff related to initializing the map
//
// Global variables:
//
// trip_markers_global               // markers on map for trips
// trip_info_texts_global                    // info balloons on map for events
// event_markers_global               // markers on map for trips
// event_info_texts_global                    // info balloons on map for events
// map_global                          // the google map object

function initialize_map() {
    // init map
    var center = new google.maps.LatLng(20,0);
    var mapOptions = {
        zoom: 2,
        center: center,
        scrollwheel: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    }
    var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    map_global = map;

    // init data points
    trip_info_texts_global = new Array();
    trip_markers_global = new Array();
    event_markers_global = new Array();
    event_info_texts_global = new Array();

    // other init stuffs
    initialize_search_autocomplete(map);

    // upadte trips in timeline with those visible on map
    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
        onZoomTimelineUpdate(bounds);
        onZoomFeedUpdate(bounds);
    });
}

function populate_map_with_trips(trips) {
    var map = map_global;

    // pretty pin icon 
    var getPinIcon = function(image) {
       return new google.maps.MarkerImage(
         image, null, null, null,
         new google.maps.Size(30,30));
    };

    // pretty info window
    var infowindow = new google.maps.InfoWindow({content: 'blank'});

    // populate trips on map
    for (var i = 0; i < trips.length; i++)
    {
        // create pin on map
        var trip = trips[i]
        // each pt has latlng + image (that's it)
        var noiseScale = 0.1; // pulled out of Momchil's ass
        var noiseLat = (Math.random() - 0.5) * noiseScale;
        var noiseLng = (Math.random() - 0.5) * noiseScale;
        var latlng = new google.maps.LatLng(trip['location_lat'] + noiseLat, trip['location_long'] + noiseLng);
        var image = "http://graph.facebook.com/" + trip['user_fbid'] + "/picture";
        var pinIcon = getPinIcon(image);
        var is_mine = trip['is_mine'];

        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            icon: pinIcon,
            draggable: is_mine
        });

        trip_markers_global.push(marker); // for zoomin/zoom out changes

        // add info bubble to marker
        var edit_link = "<br /><a href='#' onclick='populateTripFormFromDataTable(dataTable_global, " + i.toString() + "); showEditTripPrompt();'>Edit Trip</a>"; // note that we expect the order in dataTable_global to be the same as the order in which we traverse the trips here; a bit too coupled maybe TODO maybe use alternative storage for all trips
        var get_in_touch_link = "<a href='mailto:" + trip['user_email'] 
            + "?subject=[pton.in] Hey, regarding your trip to " + trip['location_name'] 
            + " on " + trip['start_date_short'] + "' target='_blank'>Get in touch</a>";
        trip_info_texts_global[i] = trip['user_name'] + "<br /><br />I'll be in " + trip['location_name'] 
                     + " from " + trip['start_date_short'] + " to " + trip['end_date_short'] + "."
                     + " " + trip['doing_what'] + "<br />"
                     + (trip['looking_for_roomies'] ? "Looking for roommates.<br />" : "")
                     + (trip['looking_for_housing'] ? "Looking for housing.<br />" : "")
                     + trip['comment'] + "<br />"
                     + (is_mine ? edit_link : get_in_touch_link) 

        google.maps.event.addListener(marker, 'click', (function(event, index) { 
            return function() {
                infowindow.content = trip_info_texts_global[index];
                infowindow.open(map, this);
            }
        })(marker, i));
        
        google.maps.event.addListener(marker, 'dragend', (function(event, row) {
            return function() {
                var location_lat = marker.position.lat();
                var location_long = marker.position.lng();
                // again, a bit of coupling -- we use dataTable_global to retrieve the trip_id... although we could avoid this by passing it directly, we do need to change the location_lat and location_long in the table anyway, so might as well use it all the way. TODO fix when (if) we use an alternative global representation for all trips (like edit_link above)
                var trip_id = dataTable_global.getValue(row, 15);
                change_latlong(trip_id, location_lat, location_long); 
                // update the date times in table for the edit prompt
                dataTable_global.setValue(row, 10, location_lat.toString()); 
                dataTable_global.setValue(row, 11, location_long.toString()); 
                //alert('moved marker number ' + row.toString() + ' coords ' + location_lat.toString() + ' ' + location_long.toString());
            }
        })(marker, i));
    }

    // markerclusterer -- this makes things pretty
    var mcOptions = {gridSize: 50, maxZoom: 10};
    var mc = new MarkerClusterer(map, trip_markers_global, mcOptions); 
}





function populate_map_with_events(events) {
    events_data_global = events; // store events globally
    var map = map_global;

    // pretty pin icon 
    var getPinIcon = function(image) {
       return new google.maps.MarkerImage(
         image, null, null, null,
         new google.maps.Size(30,30));
    };

    // pretty info window
    var infowindow = new google.maps.InfoWindow({content: 'blank'});

    // populate trips on map
    for (var i = 0; i < events.length; i++)
    {
        // create pin on map
        var event_obj = events[i];
        // each pt has latlng + image (that's it)
        var noiseScale = 0.1; // pulled out of Momchil's ass
        var noiseLat = (Math.random() - 0.5) * noiseScale;
        var noiseLng = (Math.random() - 0.5) * noiseScale;
        var latlng = new google.maps.LatLng(event_obj['location_lat'] + noiseLat, event_obj['location_long'] + noiseLng);
        var image = "http://graph.facebook.com/" + event_obj['user_fbid'] + "/picture"; // TODO FIXME find image of note / normal pin icon!!!
        var pinIcon = getPinIcon(image);
        var is_mine = event_obj['is_mine'];

        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            draggable: is_mine
        });

        event_markers_global.push(marker); // for zoomin/zoom out changes

        
        // add info bubble to marker
        var edit_link = "<br /><a href='#' onclick='populateEventFormFromData(events_data_global, " + i.toString() + "); showEditEventPrompt();'>Edit Event</a>";
        var added_by_link = "<br />Added by <a href='mailto:" + event_obj['user_email'] 
            + "?subject=[pton.in] Hey, regarding your event " + event_obj['title'] 
            + " on " + event_obj['start_date_short'] + "' target='_blank'>" + event_obj['user_name'] + "</a>";
        var event_title = (event_obj['url']
            ? "<a href='" + event_obj['url'] + "' target='_blank'>" + event_obj['title'] +  "</a>"
            : event_obj['title']
        );
        event_info_texts_global[i] = event_title + " on " + event_obj['start_date_short'] + " at " + event_obj['start_time_short']
                     + "<br /><br />" + event_obj['description'] 
                     + added_by_link
                     + (is_mine ? edit_link : "");

        google.maps.event.addListener(marker, 'click', (function(event, index) { 
            return function() {
                infowindow.content = event_info_texts_global[index];
                infowindow.open(map, this);
            }
        })(marker, i));
        
        // TODO
        google.maps.event.addListener(marker, 'dragend', (function(event, row) {
            return function() {
                var location_lat = marker.position.lat();
                var location_long = marker.position.lng();
                // again, a bit of coupling -- we use dataTable_global to retrieve the trip_id... although we could avoid this by passing it directly, we do need to change the location_lat and location_long in the table anyway, so might as well use it all the way. TODO fix when (if) we use an alternative global representation for all trips (like edit_link above)
                var trip_id = dataTable_global.getValue(row, 15);
                change_latlong(trip_id, location_lat, location_long); 
                // update the date times in table for the edit prompt
                dataTable_global.setValue(row, 10, location_lat.toString()); 
                dataTable_global.setValue(row, 11, location_long.toString()); 
                //alert('moved marker number ' + row.toString() + ' coords ' + location_lat.toString() + ' ' + location_long.toString());
            }
        })(marker, i));
    }

}


function initialize_search_autocomplete(map) {
  var input = document.getElementById('searchTextField');
  var autocomplete = new google.maps.places.Autocomplete(input);

  autocomplete.bindTo('bounds', map);

  var infowindow = new google.maps.InfoWindow();

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    infowindow.close();
    var place = autocomplete.getPlace();
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);  // Why 17? Because it looks good.
    }
    //alert(autocomplete.getBounds());
    var image = new google.maps.MarkerImage(
        place.icon, new google.maps.Size(71, 71),
        new google.maps.Point(0, 0), new google.maps.Point(17, 34),
        new google.maps.Size(35, 35));

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] &&
         place.address_components[0].short_name || ''),
        (place.address_components[1] &&
         place.address_components[1].short_name || ''),
        (place.address_components[2] &&
         place.address_components[2].short_name || '')].join(' ');
    }

  });

}

