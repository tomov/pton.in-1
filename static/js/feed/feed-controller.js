// blah blah

function updateEventFeed() {
    var events = events_data_global;
    $('#feed tr').not(':first').remove();

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
