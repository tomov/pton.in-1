// stuff related to controlling markers on the map
//

function set_trip_markers_visibility(are_visible) {
	/*for (var i = 0; i < trip_markers_global.length; i++) {
		trip_markers_global[i].setVisible(are_visible);
	}*/
	if (are_visible) {
		markerclusterer_global.setMap(map_global);
	} else {
		markerclusterer_global.setMap(hidden_map_global);
	}
	markerclusterer_global.resetViewport();
	markerclusterer_global.redraw();
}

function set_event_markers_visibility(are_visible) {
	for (var i = 0; i < event_markers_global.length; i++) {
		event_markers_global[i].setVisible(are_visible);
	}
}

function set_meal_markers_visibility(are_visible) {
	for (var i = 0; i < meal_markers_global.length; i++) {
		meal_markers_global[i].setVisible(are_visible);
	}
}
