function showTripPrompt() {
    $('#location_prompt').show();
    $('#show-link').hide();
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
    $('#location_prompt').hide();
    if (document.getElementById('show-link')) {
        $('#show-link').show();
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

function getFormData() {
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
  if (document.getElementById('location_prompt')) {
    var input = document.getElementById('location_name');
    var prompt_autocomplete = new google.maps.places.Autocomplete(input);
    google.maps.event.addListener(prompt_autocomplete, 'place_changed', function() {
        var place = prompt_autocomplete.getPlace();
        $('#location_lat').val(place.geometry.location.lat());
        $('#location_long').val(place.geometry.location.lng());
    });

    $('#hide-link').click(hideTripPrompt);

    if (document.getElementById('show-link')) {
      $('#show-link').click(function() {
          onNew();
      });
    }

    $('#add-trip-button').click(function() {
        var form_data = getFormData();
        $.ajax({
            'url' : 'add_trip',   // TODO {{ url_for... }} but can't really
            'type' : 'POST',
            'dataType' : 'json',
            'data' : form_data,
            'success' : addTripSuccess,
            'error' : function(jqXHR, textStatus, errorThrown) {
                alert('Something went wrong with the server -- couldn\'t add trip...');
            }
        });
    });

    $('#edit-trip-button').click(function() {
        var form_data = getFormData();
        $.ajax({
            'url' : 'edit_trip/' + trip_id_global,   // TODO {{ url_for... }} but can't really
            'type' : 'POST',
            'dataType' : 'json',
            'data' : form_data,
            'success' : editTripSuccess,
            'error' : function(jqXHR, textStatus, errorThrown) {
                alert('Something went wrong with the server -- couldn\'t edit trip...');
            }
        });
    });

    $('#delete-trip-button').click(function() {
        $.ajax({
            'url' : 'delete_trip/' + trip_id_global,  // TODO {{ url_for(...
            'type' : 'GET',
            'dataType' : 'json',
            'success' : deleteTripSuccess,
            'error' : function(jqXHR, textStatus, errorThrown) {
                alert('Something went wrong with the server -- couldn\'t delete the trip...');
            }
        });        
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

