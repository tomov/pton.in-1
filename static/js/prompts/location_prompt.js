function showTripBox() {
    $('#location_prompt').removeClass('hidden');
    $('#show-link').addClass('hidden');
    $('#add-comment-link').removeClass('hidden');
    $('#add-comment-field').addClass('hidden');
    $("html, body").animate({ scrollTop: 0 }, "fast");
}

function hideTripPrompt() {
    $('#location_prompt').addClass('hidden');
    if (document.getElementById('show-link')) {
        $('#show-link').removeClass('hidden');
    }
}

function clearTripBox() {
    // call this to change the form from Edit mode to Add mode
    if ($('#location_name').val() != '') {
        $('#location_name').val('');
        $('#doing_what').val('');
        $('#start_date').val('');
        $('#end_date').val('');
        $('#comment').val('');
        $('#location_lat').val('');
        $('#location_long').val('');
        $('#delete-trip-button').hide();
    }
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

    $('#add-comment-link').click(function() {
        $('#add-comment-link').addClass('hidden');
        $('#add-comment-field').removeClass('hidden');
    });

    $('#submit_trip_button').click(function() {
        form_data = {
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
  }
});


function addTripSuccess(data, textStatus, jqXHR) {
    hideTripPrompt(); 
}
