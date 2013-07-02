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


function populateEventFormFromData(events, index) {
    var event_obj = events[index];
    var title = event_obj['title'];
    var description = event_obj['description'];
    var url = event_obj['url'];
    var start_date_form = event_obj['start_date_form'];
    var end_date_form = event_obj['end_date_form'];
    var location_name = event_obj['location_name'];
    var location_lat = event_obj['location_lat'];
    var location_long = event_obj['location_long'];
    event_id_global = event_obj['id']; // this is crucial for the form to work
    $('#event_title').val(title);
    $('#event_description').val(description);
    $('#event_url').val(url);
    $('#event_start_date').val(start_date_form);
    $('#event_end_date').val(end_date_form);
    $('#event_location_name').val(location_name);
    $('#event_location_lat').val(location_lat);
    $('#event_location_long').val(location_long);
}


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


    var startDateTextBox = $('#event_start_date');
    var endDateTextBox = $('#event_end_date');

    startDateTextBox.datetimepicker({ 
        onClose: function(dateText, inst) {
            if (endDateTextBox.val() != '') {
                var testStartDate = startDateTextBox.datetimepicker('getDate');
                var testEndDate = endDateTextBox.datetimepicker('getDate');
                if (testStartDate > testEndDate)
                    endDateTextBox.datetimepicker('setDate', testStartDate);
            }
            else {
                endDateTextBox.val(dateText);
            }
        },
        onSelect: function (selectedDateTime){
            endDateTextBox.datetimepicker('option', 'minDate', startDateTextBox.datetimepicker('getDate') );
        }
    });
    endDateTextBox.datetimepicker({ 
        onClose: function(dateText, inst) {
            if (startDateTextBox.val() != '') {
                var testStartDate = startDateTextBox.datetimepicker('getDate');
                var testEndDate = endDateTextBox.datetimepicker('getDate');
                if (testStartDate > testEndDate)
                    startDateTextBox.datetimepicker('setDate', testEndDate);
            }
            else {
                startDateTextBox.val(dateText);
            }
        },
        onSelect: function (selectedDateTime){
            startDateTextBox.datetimepicker('option', 'maxDate', endDateTextBox.datetimepicker('getDate') );
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

