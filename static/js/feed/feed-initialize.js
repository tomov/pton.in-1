// initialize the feed

function initialize_events_feed() {
    clear_events_feed();
}

function initialize_meals_feed() {
    clear_meals_feed();
}

function clear_events_feed() {
    $('#events-feed tr').not(':first').remove();
}

function clear_meals_feed() {
    $('#meals-feed tr').not(':first').remove();  
}

function populate_feed_with_events(events) {
    var feed_new_html = '';
    for (var i = 0; i < events.length; i++) {
        var event_obj = events[i];
        var event_title = (event_obj['url'] ? "<a href='" + event_obj['url'] + "'>" + event_obj['title'] +  "</a>" : event_obj['title']);
        var location_name = "<br />Location: " + event_obj['location_name'];
        var radio_buttons = "<br /><br />" 
                          + "<input type='radio' name='rsvp_status_" + event_obj['id'] + "' value='yes' onclick=\"set_event_rsvp(" + event_obj['id'] + ", 'yes', null);\" " + (event_obj['rsvp_status'] == 'yes' ? 'checked' : '') + "/> Going "
                          + "<input type='radio' name='rsvp_status_" + event_obj['id'] + "' value='maybe' onclick=\"set_event_rsvp(" + event_obj['id'] + ", 'maybe', null);\" " + (event_obj['rsvp_status'] == 'maybe' ? 'checked' : '') + "/> Just remind me "
                          + "<input type='radio' name='rsvp_status_" + event_obj['id'] + "' value='no' onclick=\"set_event_rsvp(" + event_obj['id'] + ", 'no', null);\" " + (event_obj['rsvp_status'] == 'no' ? 'checked' : '') + "/> Not going ";
        // TODO FIXME (coupling) -- assumes events_data_global == events
        edit_link = (event_obj['is_mine'] ? " <a href='#' onclick='populateEventFormFromData(events_data_global, " + i.toString() + "); showEditEventPrompt();'>[edit]</a>" : "");
        var info_text = event_title + " on " + event_obj['start_date_short'] + " at " + event_obj['start_time_short']
                     + edit_link
                     + (event_obj['location_name'] ? location_name : "")
                     + "<br /><br />" + event_obj['description']
                     + radio_buttons;

        feed_new_html += '<tr><td>' + info_text + '</td></tr>';
    }

    $('#events-feed tr').first().after(feed_new_html); 
}

function populate_feed_with_meals(meals) {
    var feed_new_html = '';
    for (var i = 0; i < meals.length; i++) {
        var meal_obj = meals[i];
        var invitees = 'Invitees: ' + meal_obj['user_first_name'] + ' ' + meal_obj['user_last_name'];
        for (var j = 0; j < meal_obj['invitees'].length; j++) {
            invitees += ', ' + meal_obj['invitees'][j];
        }

        var info_text;
        if (meal_obj['is_mine']) {
            // show admin panel for RSVP's
            var invitees_yes = '<br />Coming: ';
            for (var j = 0; j < meal_obj['invitees_yes'].length; j++) {
                invitees_yes += meal_obj['invitees_yes'][j] + ', ';
            }
            var invitees_no = '<br />Not coming: ';
            for (var j = 0; j < meal_obj['invitees_no'].length; j++) {
                invitees_no += meal_obj['invitees_no'][j] + ', ';
            }
            var invitees_waiting = '<br />Waiting responses: ';
            for (var j = 0; j < meal_obj['invitees_waiting'].length; j++) {
                invitees_waiting += meal_obj['invitees_waiting'][j] + ', ';
            }
            var delete_meal_button = "<a href='#' onclick=\"bootbox.confirm('Are you sure you want to cancel the meal? All invitees will receive an e-mail notification.', function(result) {\
                if (result) {\
                    delete_meal(" + meal_obj['id'] + ", deleteMealSuccess);\
                }\
            });\">Cancel Meal</a>";
            info_text = "Meal invitation by me on " + meal_obj['when_short'] + " at " + meal_obj['location_name']
                        + "<br /><br />" + meal_obj['message']  
                        + invitees_yes + invitees_no + invitees_waiting
                        + "<br /><br />" + delete_meal_button;
        } else {
            // general meal RSVP's
            var radio_buttons = "<br /><br />" 
                              + "<input type='radio' name='meal_rsvp_confirmed_" + meal_obj['id'] + "' value='1' onclick=\"$('#meal_rsvp_box_" + meal_obj['id'] + "').show();\" " + (meal_obj['rsvp_confirmed'] ? 'checked' : '') + "/> I can come! "
                              + "<input type='radio' name='meal_rsvp_confirmed_" + meal_obj['id'] + "' value='0' onclick=\"$('#meal_rsvp_box_" + meal_obj['id'] + "').show();\" " + (!meal_obj['rsvp_confirmed'] ? 'checked' : '') + "/> I cannot make it (please leave a message)";
            var rsvp_message = "<br /><textarea id='meal_rsvp_message_" + meal_obj['id'] +  "' placeholder='Please leave your host a message'></textarea>";
            var user_has_not_rsvpd = (meal_obj['rsvp_confirmed'] == null);
            var big_red_sign = '';
            if (user_has_not_rsvpd) {
                big_red_sign = ' -- <span id="big_red_sign_' + meal_obj['id'] + '" style="color: red; font-weight: bold;">You have NOT yet RSVP\'d to this meal</span>';
            }
            var rsvp_button = "<br /><input type='button' id='meal_rsvp_submit_" + meal_obj['id'] + "' value='" 
                + (user_has_not_rsvpd ? 'Submit response' : 'Change response') 
                + "' onclick=\"set_meal_rsvp(" + meal_obj['id'] + ", $('input:radio[name=meal_rsvp_confirmed_" + meal_obj['id'] + "]:checked').val(), $('#meal_rsvp_message_" + meal_obj['id'] +  "').val(), setMealRsvpSuccess);\" />";
            var rsvp_box = "<div id='meal_rsvp_box_" + meal_obj['id'] + "' " + (user_has_not_rsvpd ? "" : "style='display: none;'") + ">" 
                + rsvp_message + rsvp_button + "</div>";
            info_text = "Meal invitation by " + meal_obj['user_first_name'] + " on " + meal_obj['when_short'] + big_red_sign
                         + "<br />Location: " + meal_obj['location_name']
                         + "<br />" + invitees
                         + "<br /><br />" + meal_obj['message']
                         + radio_buttons
                         + rsvp_box;
        }

        feed_new_html += '<tr><td>' + info_text + '</td></tr>';
    }

    $('#meals-feed tr').first().after(feed_new_html);
}
