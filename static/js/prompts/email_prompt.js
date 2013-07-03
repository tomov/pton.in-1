MAX_MASS_EMAILS = 60;  // maximum number of e-mails you can send at once -- must be zoomed in enough


function massEmail() {
	// TODO FIXME tons of code duplication with meal_prompt... probably store all visible trips in separate variable that gets updated
	// only once 
    if (typeof trip_markers_global === 'undefined' || typeof timeline === 'undefined') {
        //  sometimes gets called before the timeline / map has loaded
        return;
    }

    var bounds = map_global.getBounds();
    var emails = [];
    for (var j=0;j<trip_markers_global.length;j++) {
        // TODO coupling -- assumes trips_data_global and trip_markers_global are in the same order....
        // perhaps merge them?
        var trip = trips_data_global[j];
        if (bounds.contains(trip_markers_global[j].getPosition())) {
        	emails.push(trip['user_email']);
        }
    }
    if (emails.length > MAX_MASS_EMAILS) {
    	bootbox.alert("You cannot send more than " + MAX_MASS_EMAILS + " e-mails at once. Try zooming in more.", function() {
    		// no callback
		});
		return;
    }

    var href = "mailto:" + emails.join();
    window.open(href, "_blank");
}


$(function() {
	$('#mass-email-link').click(massEmail);
});