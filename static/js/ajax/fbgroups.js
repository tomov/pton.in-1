function add_fbgroup(form_data, callback) {
    $.ajax({
        'url' : 'add_fbgroup',   // TODO {{ url_for... }} but can't really
        'type' : 'POST',
        'data' : form_data,
        'success' : callback,
        'error' : function(jqXHR, textStatus, errorThrown) {
            alert('Something went wrong with the server -- couldn\'t add fb group...');
        }
    });
}