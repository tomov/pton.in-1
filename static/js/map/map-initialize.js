// stuff related to initializing the map
//

function get_trips_for_map_success(data, textStatus, jqXHR) {
    var trips = data;
    var map = map_global;

    // init data points
    info_text = new Array();
    markers_global = new Array();
    marker_idx = 0;

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
        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            icon: pinIcon,
        });

        markers_global.push(marker); // for zoomin/zoom out changes

        // add info bubble to marker
        edit_link = "<br /><a href='#' onclick='populateFormFromDataTable(dataTable_global, " + i.toString() + "); showEditTripPrompt();'>Edit Trip</a>"; // note that we expect the order in dataTable_global to be the same as the order in which we traverse the trips here; a bit too coupled maybe TODO maybe use alternative storage for all trips
        get_in_touch_link = "<a href='mailto:" + trip['user_email'] 
            + "?subject=[pton.in] Hey, regarding your trip to " + trip['location_name'] 
            + " on " + trip['start_date_short'] + "' target='_blank'>Get in touch</a>"
        marker_idx++;
        info_text[marker_idx] = trip['user_name'] + "<br /><br />I'll be in " + trip['location_name'] 
                     + " from " + trip['start_date_short'] + " to " + trip['end_date_short'] + "."
                     + " " + trip['doing_what'] + "<br />"
                     + (trip['looking_for_roomies'] ? "Looking for roommates.<br />" : "")
                     + (trip['looking_for_housing'] ? "Looking for housing.<br />" : "")
                     + trip['comment'] + "<br />"
                     + (trip['is_mine'] ? edit_link : get_in_touch_link) 

        google.maps.event.addListener(marker, 'click', (function(event, index) { 
            return function() {
                infowindow.content = info_text[index];
                infowindow.open(map, this);
            }
        })(marker, marker_idx));
         
    }

    // markerclusterer -- this makes things pretty
    var mcOptions = {gridSize: 50, maxZoom: 10};
    var mc = new MarkerClusterer(map, markers_global, mcOptions); 
}

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

    initialize_autocomplete(map);

    map_global = map;
    get_trips_for_map(get_trips_for_map_success); // fetch all trips from db using ajax

    // upadte trips in timeline with those visible on map
    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
        onZoom(bounds);
    });
}

google.maps.event.addDomListener(window, 'load', initialize_map);


function initialize_autocomplete(map) {
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

