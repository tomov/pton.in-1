function showFbgroupPrompt() {
    $('#fbgroup_prompt').show();
    $('#show-fbgroup-link').hide();
    $("html, body").animate({ scrollTop: 0 }, "fast");
}

function showAddFbgroupPrompt() {
    prepareFbgroupBox();
    $('#add-fbgroup-button').show();
    showFbgroupPrompt();
}

function showEditFbgroupPrompt() {
    $('#add-fbgroup-button').hide();
    showFbgroupPrompt();
}

function hideFbgroupPrompt() {
    $('#fbgroup_prompt').hide();
    if (document.getElementById('show-fbgroup-link')) {
        $('#show-fbgroup-link').show();
    }
}

function prepareFbgroupBox() {
    $('#fbgroup_name').val('');
    $('#fbgroup_description').val('');
    // generate group name intelligently
    var group = group_name_global ? group_name_global : 'Princeton';
    var latlng = map_global.getCenter();
    geocoder_global.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[1]) {
                result = results[results.length-2];
                location_name = result['formatted_address'];
                $('#fbgroup_name').val(group + ' in ' + location_name);
                $('#fbgroup_description').val('A group for the ' + group + ' peeps in ' + location_name);
            }
        }
    });
    $('#fbgroup_invitees').val('');
    $('#fbgroup_privacy').val('closed'); // TODO a bit of coupling... whatevs
}

function getFbgroupFormData() {
    form_data = $('#fbgroup_form').serialize();
    return form_data;
}

$(function() {
  if (document.getElementById('fbgroup_prompt')) {
    $('#hide-fbgroup-link').click(hideFbgroupPrompt);

    if (document.getElementById('show-fbgroup-link')) {
      $('#show-fbgroup-link').click(function() {
          showAddFbgroupPrompt();
      });
    }

    $('#add-fbgroup-button').click(function() {
        var form_data = getFbgroupFormData();
        add_fbgroup(form_data, addFbgroupSuccess);
    });

    $('#select-all-fbgroup-invitees').click(function() {
        $('#fbgroup_invitees option').prop('selected', 'selected');
    });

    // SOOO ghetto... lolz
    fbgroup_invitees_all_options_global = $('#fbgroup_invitees > option').clone();  
  }
});

function addFbgroupSuccess(data, textStatus, jqXHR) {
    hideFbgroupPrompt();
    fbgroup_fbid = data['fbid'];
    window.location = 'https://www.facebook.com/groups/' + fbgroup_fbid;  // TODO FIXME hardcoded link
}

function onZoomFbgroupPromptUpdate(bounds) {
    // TODO FIXME lots of code duplication with meals...and events...and everything... yuck
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
    $('#fbgroup_invitees').empty();
    fbgroup_invitees_all_options_global.each(function() {
        if (visible_option_values[this.value]) {
            $('#fbgroup_invitees').append($("<option />").val(this.value).text(this.text));
        }
    });
}

