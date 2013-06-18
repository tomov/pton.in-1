function showTripPrompt() {
    $('#trip_prompt').show();
    $('#show-trip-link').hide();
    $("html, body").animate({ scrollTop: 0 }, "fast");
}

function showAddTripPrompt() {
    clearTripBox();
    $('#add-trip-button').show();
    $('#edit-trip-panel').hide();
    showTripPrompt();
}

function showEditTripPrompt() {
    $('#add-trip-button').hide();
    $('#edit-trip-panel').show();
    showTripPrompt();
}

function hideTripPrompt() {
    $('#trip_prompt').hide();
    if (document.getElementById('show-trip-link')) {
        $('#show-trip-link').show();
    }
}

function clearTripBox() {
    // call this to change the form from Edit mode to Add mode
    $('#location_name').val('');
    $('#doing_what').val('');
    $('#start_date').val('');
    $('#end_date').val('');
    $('#comment').val('');
    $('#location_lat').val('');
    $('#location_long').val('');
}

function populateFormFromDataTable(data, row) { // data is either dataTable or dataView, row is the row index... TODO a bit of coupling with dataTable_global and its internal structure
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
}

function getTripFormData() {
    var form_data = {
        'csrf_token': $('#csrf_token').val(),
        'location_name': $('#location_name').val(),
        'doing_what': $('#doing_what').val(),
        'location_lat': $('#location_lat').val(),
        'location_long': $('#location_long').val(),
        'start_date': $('#start_date').val(),
        'end_date': $('#end_date').val(),
        'comment': $('#comment').val()
    };
    if ($('#looking_for_roomies').is(':checked')) {
        form_data['looking_for_roomies'] = $('#looking_for_roomies').val();
    }
    if ($('#looking_for_housing').is(':checked')) {
        form_data['looking_for_housing'] = $('#looking_for_housing').val();
    }
    return form_data;
}

$(function() {
  if (document.getElementById('trip_prompt')) {
    var input = document.getElementById('location_name');
    var prompt_autocomplete = new google.maps.places.Autocomplete(input);
    google.maps.event.addListener(prompt_autocomplete, 'place_changed', function() {
        var place = prompt_autocomplete.getPlace();
        $('#location_lat').val(place.geometry.location.lat());
        $('#location_long').val(place.geometry.location.lng());
    });

    $('#hide-trip-link').click(hideTripPrompt);

    if (document.getElementById('show-trip-link')) {
      $('#show-trip-link').click(function() {
          onNew();
      });
    }

    $('#add-trip-button').click(function() {
        var form_data = getTripFormData();
        add_trip(form_data, addTripSuccess);
    });

    $('#edit-trip-button').click(function() {
        var form_data = getTripFormData();
        edit_trip(trip_id_global, form_data, editTripSuccess)
    });

    $('#delete-trip-button').click(function() {
        delete_trip(trip_id_global, deleteTripSuccess);
    });
 
  }
});

function addTripSuccess(data, textStatus, jqXHR) {
    hideTripPrompt();
    location.reload();  // TODO Like mplungjan explained in the comment below, the reload() function takes an optional parameter that can be set to true to reload from the server rather than the cache. The parameter defaults to false, so by default the page reloads from the browser's cache. --- TEST IN REAL LIFE IN OTHER BROWSERS, OTHER USERS ETC ... also just remove altogether and add trip intelligently to timetable
}

function editTripSuccess(data, textStatus, jqXHR) {
    hideTripPrompt();
    location.reload();  // TODO Like mplungjan explained in the comment below, the reload() function takes an optional parameter that can be set to true to reload from the server rather than the cache. The parameter defaults to false, so by default the page reloads from the browser's cache. --- TEST IN REAL LIFE IN OTHER BROWSERS, OTHER USERS ETC ... also just remove altogether and add trip intelligently to timetable
}

function deleteTripSuccess(data, textStatus, jqXHR) {
    hideTripPrompt();
    location.reload();  // TODO Like mplungjan explained in the comment below, the reload() function takes an optional parameter that can be set to true to reload from the server rather than the cache. The parameter defaults to false, so by default the page reloads from the browser's cache. --- TEST IN REAL LIFE IN OTHER BROWSERS, OTHER USERS ETC ... also just remove altogether and add trip intelligently to timetable
}

