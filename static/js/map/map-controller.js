function initialize() {
    // init map
    var center = new google.maps.LatLng(20,0);
    var mapOptions = {
        zoom: 2,
        center: center,
        scrollwheel: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    }
    var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}

google.maps.event.addDomListener(window, 'load', initialize);


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

