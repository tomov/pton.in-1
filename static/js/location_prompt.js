function showTripBox() {
    $('#location_prompt').removeClass('hidden');
    $('#show-link').addClass('hidden');
    $('#add-comment-link').removeClass('hidden');
    $('#add-comment-field').addClass('hidden');
    $("html, body").animate({ scrollTop: 0 }, "fast");
}

function clearTripBox() {
    // call this to change the form from Edit mode to Add mode
    if ($('#location_name').val() != '') {
//HACK
    $('#populate_form').attr('action', '/populate');
    $('#location_name').val('');
    $('#doing_what').val('');
    $('#start_date').val('');
    $('#end_date').val('');
    $('#comment').val('');
    $('#location_lat').val('');
    $('#location_long').val('');
    $('#delete-trip-button').hide();
    }
}

$(function() {
  if (document.getElementById('location_prompt')) {
    $( "#location_name" ).autocomplete({
      source: function( request, response ) {
                $.ajax({
                url: "http://ws.geonames.org/searchJSON",
                dataType: "json",
                async: false,
                data: {
                  featureClass: "P",
                  style: "full",
                  maxRows: 12,
                  name_startsWith: request.term
                },
                success: function( data ) {
                           response( $.map( data.geonames, function( item ) {
                             return {
                               label: item.name + (item.adminName1 ? ", " + item.adminName1 : "") + ", " + item.countryName,
                               value: item.name + (item.adminName1 ? ", " + item.adminName1 : "") + ", " + item.countryName,
                               lat: item.lat,
                               lng: item.lng,
                             }
                           }));
                         }
                });
              },
      minLength: 1,
      select: function( event, ui ) {
        if (ui.item) {
          place = ui.item.label.split(",");
          $("#location_lat").val(ui.item.lat);
          $("#location_long").val(ui.item.lng);
        }
      }
    });

    var changes = 0;
    $('#location_name').click(function() {
      changes++;
      setTimeout(function() {
          changes--;
          if (changes <= 0) $('#spinner').detach();
      }, 1000)
      $('<div id="spinner"></div>').insertAfter($('#location_name'));  
      $("#location_name").autocomplete( "search", $("#location_name").val() );
    });

    $('#hide-link').click(function() {
      $('#location_prompt').addClass('hidden');
      if (document.getElementById('show-link')) {
        $('#show-link').removeClass('hidden');
      }
    });

    if (document.getElementById('show-link')) {
      $('#show-link').click(function() {
          onNew();
      });
    }

    $('#add-comment-link').click(function() {
        $('#add-comment-link').addClass('hidden');
        $('#add-comment-field').removeClass('hidden');
    });
  }
});

