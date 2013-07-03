// initialize the feed

function initialize_feed() {
    clear_feed();
}

function clear_feed() {
    $('#feed tr').not(':first').remove();
}

function populate_feed_with_events(events) {
    var feed_new_html = '';
    for (var i = 0; i < events.length; i++) {
        var event_obj = events[i];
        var event_link = "<br /><br /><a href='" + event_obj['url'] + "'>" + 'link' +  "</a>";
        var location_name = "<br />Location: " + event_obj['location_name'];
        var info_text = event_obj['title'] + " on " + event_obj['start_date_short'] + " at " + event_obj['start_time_short']
                     + (event_obj['location_name'] ? location_name : "")
                     + "<br /><br />" + event_obj['description']
                     + (event_obj['url'] ? event_link : "")

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
