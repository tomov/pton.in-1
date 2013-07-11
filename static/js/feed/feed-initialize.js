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
        var invitees = 'Invitees: ';
        for (var j = 0; j < meal_obj['invitees'].length; j++) {
            invitees += meal_obj['invitees'][j] + ', ';
        }
        var info_text = "Meal invitation by " + meal_obj['user_first_name'] + " on " + meal_obj['when_short']
                     + "<br />" + invitees
                     + "<br /><br />" + meal_obj['message'];
                     + "<br /><br /> <a>I can make it!</a> | <a>Sorry I'm busy</a>"

        feed_new_html += '<tr><td>' + info_text + '</td></tr>';
    }

    $('#meals-feed tr').first().after(feed_new_html);
}
