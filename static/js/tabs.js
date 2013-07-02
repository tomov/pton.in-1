function initialize_tabs() {

	$('a[data-toggle="tab"]').on('shown', function (e) {

        // change stuff based on which tab we switch to
        switch ($(e.target).attr('href')) {
        	case '#timeline-tab':
        		set_trip_markers_visibility(true);
        		break;
        	case '#events-tab':
        		set_event_markers_visibility(true);
        		break;
        	case '#meals-tab':
        		set_meal_markers_visibility(true);
        		break;
        }

        // change stuff based on which tab we hid
        switch ($(e.relatedTarget).attr('href')) {
        	case '#timeline-tab':
        		set_trip_markers_visibility(false);
        		break;
        	case '#events-tab':
        		set_event_markers_visibility(false);
        		break;
        	case '#meals-tab':
        		set_meal_markers_visibility(false);
        		break;
        }
	});

    $('#tabs a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

}