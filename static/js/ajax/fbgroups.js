function add_fbgroup(form_data, callback) {
    $.ajax({
        'url' : 'add_fbgroup',   // TODO {{ url_for... }} but can't really
        'type' : 'POST',
        'dataType' : 'JSON',
        'data' : form_data,
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            // TODO FIXME coupling with backend -- error messages sent from backend, whereas for e.g. mass e-mails they are stored in frontend. Figure out standard
            bootbox.alert(errorThrown, function() {
                // no callback
            });
        }
    });
}