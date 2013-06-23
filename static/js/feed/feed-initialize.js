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
        var info_text = event_obj['title'] + " on " + event_obj['start_date_short'] + " at " + event_obj['start_time_short']
                     + "<br /><br />" + event_obj['description']
                     + (event_obj['url'] ? event_link : "")

        feed_new_html += '<tr><td>' + info_text + '</td></tr>';
    }

    $('#feed tr').first().after(feed_new_html); 
}

function populate_feed_with_meals(meals) {
    var feed_new_html = '';
    for (var i = 0; i < meals.length; i++) {
        var meal_obj = meals[i];
        var info_text = "Meal with " + meal_obj['user_first_name'] + " on " + meal_obj['when_short']
                     + "<br /><br />" + meal_obj['message'];

        feed_new_html += '<tr><td>' + info_text + '</td></tr>';
    }

    $('#feed tr').first().after(feed_new_html);
}
