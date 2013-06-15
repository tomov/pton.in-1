var dataTable_global; // for now, in timeline_controller, basically all functions rely on these being global
var dataView_global;
//var timeline_global;   // seems like this HAS to be called this way... renaming it starts throwing errors in timeline-lib.js which is their lib, it seems to rely on the timeline being stored in a global variable called timeline... must investigate sometime
// more mysteries... errors persist if I define var timeline; here ... weird stuff

function get_trips_for_timeline() { // TODO perhaps merge with map one?
    $.ajax({
        'url' : "get_trips_for_timeline",   // TODO FIXME Jinja
        'type' : 'GET',
        'dataType' : 'json',
        'data' : {},
        'success' : get_trips_for_timeline_success,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t fetch trips...');
        }
    });
}

function get_trips_for_timeline_success(data, textStatus, jqXHR) {
    var trips = data;

    for (var i = 0; i < trips.length; i++) {
        var trip = trips[i];

        name = "<a href='https://www.facebook.com/" + trip['user_fbid'] + "' target='_blank'>"
            + "<img src='https://graph.facebook.com/" + trip['user_fbid'] + "/picture' width='40px' height='40px' style='float: left; margin-right: 5px;'>"
            + trip['user_first_name'] + '<br />' + trip['user_last_name']
            + "</a>"

        var start = new Date(trip['start_date']); // used for timeline viz
        var end = new Date(trip['end_date']);     // used for timeline viz
        var mailtolink = "mailto:" + trip['user_email'] 
            + "?subject=[pton.in] Hey, regarding your trip to " + trip['location_name'] 
            + " on " + trip['start_date_short'];

        var availability = "Available";
        var link = mailtolink;
        if (trip['looking_for_roomies'] || trip['looking_for_housing']) {
            availability = "Unavailable";
        }
        var group = availability.toLowerCase();

        var doing_what = trip['doing_what'];
        var comment = trip['comment']
        var sign = trip['location_name'] 
            + " from " + trip['start_date_short'] + " to " + trip['end_date_short'] 
            + ". " + trip['doing_what'];
        // TODO Raymond :)
        var content = "<span style='color: write; text-decoration: none; cursor: default;'>" + sign + "</span>"; 
        var editable = false;
        var is_mine = trip['is_mine'];

        if (is_mine) {
            editable = true;
        }
        // those below are used for edit button, they're just passing the trip deets to the box
        var trip_id = trip['id'].toString();
        var location_name = trip['location_name']; 
        var location_lat = trip['location_lat'].toString();
        var location_long = trip['location_long'].toString(); 
        var start_date = trip['start_date_form']; // these are strings to be compatible with the wtform fields (see form.py)
        var end_date = trip['end_date_form'];

        dataTable_global.addRow([start, end, content, name, group, doing_what, comment, link, is_mine, location_name, location_lat, location_long, start_date, end_date, editable, trip_id]);
            
    }

/*            // DISABLE THE TOOLTIPS TEMPORARILY
            </script><!-- <div class="htmltooltip">
                I'll be in {{ trip.location_name }} from {{ trip.start_date.strftime('%b %d') }} to {{ trip.end_date.strftime('%b %d') }}. {{ doing_what }}<br />
                {% if trip.looking_for_roomies %}Looking for roommates.<br />{% endif %}
                {% if trip.looking_for_housing %}Looking for housing.<br />{% endif %}
                {{ comment }}
            </div>--><script>
*/

    // Instantiate our timeline object.
    timeline = new links.Timeline(document.getElementById('mytimeline'));

    // register event listeners
    google.visualization.events.addListener(timeline, 'edit', onEdit);
    google.visualization.events.addListener(timeline, 'delete', onDelete);
    google.visualization.events.addListener(timeline, 'select', onSelect);
    google.visualization.events.addListener(timeline, 'ready', onReady);
    google.visualization.events.addListener(timeline, 'add', onNew);
    google.visualization.events.addListener(timeline, 'change', onChange);

    // specify options
    var options = {
        width:  "100%",
        height: "99%",
        layout: "box",
        axisOnTop: true,
        eventMargin: 10,  // minimal margin between events
        eventMarginAxis: 0, // minimal margin beteen events and the axis
        editable: true,
        showNavigation: true
    };

    // Draw our timeline with the created data and options
    timeline.draw(dataView_global, options);
    timeline.setRealData(dataTable_global);

    // Set a customized visible range
    var start = new Date(2013, 4, 15);
    var end = new Date(2013, 8, 15);
    timeline.setVisibleChartRange(start, end);
    
    updateTimelineHeight(); // to compress timeline
}

function initialize_timeline() {
    var dataTable = new google.visualization.DataTable();
    dataTable_global = dataTable;
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // Note: order here MATTERS a lot -- see static/js/timeline/timeline-controller.js, data.getValue(row, ...)
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    dataTable.addColumn('datetime', 'start');
    dataTable.addColumn('datetime', 'end');
    dataTable.addColumn('string', 'content');
    dataTable.addColumn('string', 'group');
    dataTable.addColumn('string', 'className');
    dataTable.addColumn('string', 'doing_what');
    dataTable.addColumn('string', 'comment');
    dataTable.addColumn('string', 'link');
    dataTable.addColumn('boolean', 'is_mine');
    dataTable.addColumn('string', 'location');
    dataTable.addColumn('string', 'location_lat');
    dataTable.addColumn('string', 'location_long');
    dataTable.addColumn('string', 'start_date');
    dataTable.addColumn('string', 'end_date');
    dataTable.addColumn('boolean', 'editable');
    dataTable.addColumn('string', 'trip_id');

    var dataView = new google.visualization.DataView(dataTable);
    dataView_global = dataView;

    get_trips_for_timeline();

    $('#show-more').click(function() {
      $('#show-more').addClass('hidden');
      $('#show-less').removeClass('hidden');
      show_all_trips_in_timeline_global = true;
      onZoom(map_global.getBounds()); // updates timeline height too, but we need to load the extra rows that were hidden
    });

    $('#show-less').click(function() {
      $('#show-less').addClass('hidden');
      $('#show-more').removeClass('hidden');
      show_all_trips_in_timeline_global = false;
      updateTimelineHeight();
    });
}


google.load("visualization", "1");

// Set callback to run when API is loaded
google.setOnLoadCallback(initialize_timeline);

