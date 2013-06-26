function showMealPrompt() {
    $('#meal_prompt').show();
    $('#show-meal-link').hide();
    $("html, body").animate({ scrollTop: 0 }, "fast");
}

function showAddMealPrompt() {
    clearMealBox();
    $('#add-meal-button').show();
    $('#edit-meal-panel').hide();
    showMealPrompt();
}

function showEditMealPrompt() {
    $('#add-meal-button').hide();
    $('#edit-meal-panel').show();
    showMealPrompt();
}

function hideMealPrompt() {
    $('#meal_prompt').hide();
    if (document.getElementById('show-meal-link')) {
        $('#show-meal-link').show();
    }
}

function clearMealBox() {
    $('#meal_when').val('');
    $('#meal_message').val('');
    $('#meal_invitees').val('');
    $('#meal_location_name').val('');
    $('#meal_location_lat').val('');
    $('#meal_location_long').val('');
}


function populateMealFormFromData(meals, index) {
    var meal_obj = meals[index];
    var when_form = meal_obj['when_form'];
    var message = meal_obj['message'];
    var location_name = meal_obj['location_name'];
    var location_lat = meal_obj['location_lat'];
    var location_long = meal_obj['location_long'];
    meal_id_global = meal_obj['id']; // this is crucial for the form to work
    $('#meal_when').val(when_form);
    $('#meal_message').val(message);
    $('#meal_location_name').val(location_name);
    $('#meal_location_lat').val(location_lat);
    $('#meal_location_long').val(location_long);
}


function getMealFormData() {
    form_data = $('#meal_form').serialize();
    return form_data;
}

$(function() {
  if (document.getElementById('meal_prompt')) {
    var input = document.getElementById('meal_location_name');
    var meal_prompt_autocomplete = new google.maps.places.Autocomplete(input);
    google.maps.event.addListener(meal_prompt_autocomplete, 'place_changed', function() {
        var place = meal_prompt_autocomplete.getPlace();
        $('#meal_location_lat').val(place.geometry.location.lat());
        $('#meal_location_long').val(place.geometry.location.lng());
    });

    $('#hide-meal-link').click(hideMealPrompt);

    if (document.getElementById('show-meal-link')) {
      $('#show-meal-link').click(function() {
          showAddMealPrompt();
      });
    }

    $('#add-meal-button').click(function() {
        var form_data = getMealFormData();
        add_meal(form_data, addMealSuccess);
    });

    $('#edit-meal-button').click(function() {
        var form_data = getMealFormData();
        edit_meal(meal_id_global, form_data, editMealSuccess)
    });

    $('#delete-meal-button').click(function() {
        delete_meal(meal_id_global, deleteMealSuccess);
    });

    $( "#meal_when" ).datepicker({
      defaultDate: "+1w",
      changeMonth: true,
      changeYear: true,
      numberOfMonths: 1
    });

    // SOOO ghetto... lolz
    meal_invitees_all_options_global = $('#meal_invitees > option').clone();
    
  }
});

function addMealSuccess(data, textStatus, jqXHR) {
    hideMealPrompt();
    location.reload();  // TODO Like mplungjan explained in the comment below, the reload() function takes an optional parameter that can be set to true to reload from the server rather than the cache. The parameter defaults to false, so by default the page reloads from the browser's cache. --- TEST IN REAL LIFE IN OTHER BROWSERS, OTHER USERS ETC ... also just remove altogether and add trip intelligently to timetable
}

function editMealSuccess(data, textStatus, jqXHR) {
    hideMealPrompt();
    location.reload();  // TODO Like mplungjan explained in the comment below, the reload() function takes an optional parameter that can be set to true to reload from the server rather than the cache. The parameter defaults to false, so by default the page reloads from the browser's cache. --- TEST IN REAL LIFE IN OTHER BROWSERS, OTHER USERS ETC ... also just remove altogether and add trip intelligently to timetable
}

function deleteMealSuccess(data, textStatus, jqXHR) {
    hideMealPrompt();
    location.reload();  // TODO Like mplungjan explained in the comment below, the reload() function takes an optional parameter that can be set to true to reload from the server rather than the cache. The parameter defaults to false, so by default the page reloads from the browser's cache. --- TEST IN REAL LIFE IN OTHER BROWSERS, OTHER USERS ETC ... also just remove altogether and add trip intelligently to timetable
}

function onZoomMealPromptUpdate(bounds) {
    if (typeof trip_markers_global === 'undefined' || typeof timeline === 'undefined') {
        //  sometimes gets called before the timeline / map has loaded
        return;
    }
    var visible_option_values = {};
    for (var j=0;j<trip_markers_global.length;j++) {
        // TODO coupling -- assumes trips_data_global and trip_markers_global are in the same order....
        // perhaps merge them?
        var trip = trips_data_global[j];
        if (bounds.contains(trip_markers_global[j].getPosition())) {
            var value = trip['user_id'] + ':' + trip['user_fbid'];
            visible_option_values[value] = true;
        }
    }
    // must do it this way b/c .show() and .hide() don't work for select options...
    $('#meal_invitees').empty();
    meal_invitees_all_options_global.each(function() {
        if (visible_option_values[this.value]) {
            $('#meal_invitees').append($("<option />").val(this.value).text(this.text));
        }
    });
}

