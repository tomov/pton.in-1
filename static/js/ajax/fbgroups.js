function add_fbgroup(form_data, callback) {
    $.ajax({
        'url' : 'add_fbgroup',   // TODO {{ url_for... }} but can't really
        'type' : 'POST',
        'dataType' : 'JSON',
        'data' : form_data,
        'success' : function(data, textStatus, jqXHR) {
            // TODO this is an ad-hoc error handling technique but can't really come up with anything better right now
            if (data['status'] == 'success') {
                if (callback) {
                    callback(data, textStatus, jqXHR);
                }
            } else {
                bootbox.alert(data['message'], function() {
                    // no callback
                });
            }
        },
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t add fbgroup...');
        }
    });
}