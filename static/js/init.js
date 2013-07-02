// initialize all data structures (map, timeline, feed, etc)

function initialize_all() {
	initialize_timeline();
	initialize_map();
	initialize_tabs();
	initialize_feed();
	get_trips(get_trips_success);
	get_events(get_events_success);
	get_meals(get_meals_success);
}

// timeline visualization
google.load("visualization", "1");

// Set callback to run when API is loaded
google.setOnLoadCallback(initialize_all);
