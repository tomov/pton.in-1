// when we zoom the map, the feed shows only the events that are visible on the map
function onZoomFeedUpdate(bounds) {
    if (typeof event_markers_global === 'undefined') {
        // onZoomTimelineUpdate sometimes gets called before the timeline / map has loaded
        return;
    }
    var visible_events = new Array();
    // currently iterates through list... should prolly change to a 2d-tree or something evetually
    for (var j=0;j<event_markers_global.length;j++) {
        if (bounds.contains(event_markers_global[j].getPosition())) {
            visible_events.push(events_data_global[j]);
        }
    }

    clear_feed();
    populate_feed_with_events(visible_events);
    populate_feed_with_meals(meals_data_global); // TODO FIXME
}