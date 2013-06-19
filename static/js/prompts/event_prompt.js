function showEventPrompt() {
    $('#event_prompt').show();
    $('#show-event-link').hide();
    $("html, body").animate({ scrollTop: 0 }, "fast");
}

function showAddEventPrompt() {
    clearEventBox();
    $('#add-event-button').show();
    $('#edit-event-panel').hide();
    showEventPrompt();
}

function showEditEventPrompt() {
    $('#add-event-button').hide();
    $('#edit-event-panel').show();
    showEventPrompt();
}

function hideEventPrompt() {
    $('#event_prompt').hide();
    if (document.getElementById('show-event-link')) {
        $('#show-event-link').show();
    }
}

function clearEventBox() {
    // call this to change the form from Edit mode to Add mode
    // TODO conflict with clearTripBox? same field ids?
    // $('#group_id').val(''); -- we don't clear this; the field is used as a storage between backend and submit. The group id is passed in application.py/index and is not changed
    // unlike the user_id, it is not stored in the session so it is more convenient to pass it that way
    $('#event_title').val('');
    $('#event_description').val('');
    $('#event_url').val('');
    $('#event_start_date').val('');
    $('#event_end_date').val('');
    $('#event_location_name').val('');
    $('#event_location_lat').val('');
    $('#event_location_long').val('');
}

/*
TODO hehe... can't edit yet

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
*/

function getEventFormData() {
    var form_data = {
        'csrf_token': $('#event_csrf_token').val(),
        'title': $('#event_title').val(),
        'description' : $('#event_description').val(),
        'url': $('#event_url').val(),
        'location_name': $('#event_location_name').val(),
        'location_lat': $('#event_location_lat').val(),
        'location_long': $('#event_location_long').val(),
        'start_date': $('#event_start_date').val(),
        'end_date': $('#event_end_date').val(),
    };
    if ($('#event_group_id').val()) {  // this is b/c if there is no group, the group_id field is an empty string u''
        form_data['group_id'] = $('#event_group_id').val();
    }
    return form_data;
}

$(function() {
  if (document.getElementById('event_prompt')) {
    var input = document.getElementById('event_location_name');
    var event_prompt_autocomplete = new google.maps.places.Autocomplete(input);
    google.maps.event.addListener(event_prompt_autocomplete, 'place_changed', function() {
        var place = event_prompt_autocomplete.getPlace();
        // TODO conflict with trip_prompt form? investigate
        $('#event_location_lat').val(place.geometry.location.lat());
        $('#event_location_long').val(place.geometry.location.lng());
    });

    $('#hide-event-link').click(hideEventPrompt);

    if (document.getElementById('show-event-link')) {
      $('#show-event-link').click(function() {
          showAddEventPrompt();
      });
    }

    $('#add-event-button').click(function() {
        var form_data = getEventFormData();
        add_event(form_data, addEventSuccess);
    });

    $('#edit-event-button').click(function() {
        var form_data = getEventFormData();
        edit_event(event_id_global, form_data, editEventSuccess)
    });

    $('#delete-event-button').click(function() {
        delete_event(event_id_global, deleteEventSuccess);
    });

    $( "#event_start_date" ).datepicker({
      defaultDate: "+1w",
      changeMonth: true,
      changeYear: true,
      numberOfMonths: 1,
      onClose: function( selectedDate ) {
        $( "#event_end_date" ).datepicker( "option", "minDate", selectedDate );
      }
    });

    $( "#event_end_date" ).datepicker({
      defaultDate: "+1w",
      changeMonth: true,
      changeYear: true,
      numberOfMonths: 1,
      onClose: function( selectedDate ) { 
        $( "#event_start_date" ).datepicker( "option", "maxDate", selectedDate );
      } 
    });
  }
});

function addEventSuccess(data, textStatus, jqXHR) {
    hideEventPrompt();
    location.reload();  // TODO Like mplungjan explained in the comment below, the reload() function takes an optional parameter that can be set to true to reload from the server rather than the cache. The parameter defaults to false, so by default the page reloads from the browser's cache. --- TEST IN REAL LIFE IN OTHER BROWSERS, OTHER USERS ETC ... also just remove altogether and add trip intelligently to timetable
}

function editEventSuccess(data, textStatus, jqXHR) {
    hideEventPrompt();
    location.reload();  // TODO Like mplungjan explained in the comment below, the reload() function takes an optional parameter that can be set to true to reload from the server rather than the cache. The parameter defaults to false, so by default the page reloads from the browser's cache. --- TEST IN REAL LIFE IN OTHER BROWSERS, OTHER USERS ETC ... also just remove altogether and add trip intelligently to timetable
}

function deleteEventSuccess(data, textStatus, jqXHR) {
    hideEventPrompt();
    location.reload();  // TODO Like mplungjan explained in the comment below, the reload() function takes an optional parameter that can be set to true to reload from the server rather than the cache. The parameter defaults to false, so by default the page reloads from the browser's cache. --- TEST IN REAL LIFE IN OTHER BROWSERS, OTHER USERS ETC ... also just remove altogether and add trip intelligently to timetable
}

