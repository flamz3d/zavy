function areYouSure(options, callback) {

    _.extend(
        {
            title: "Are you sure?",
            confirm_button: "Delete",
            cancel_button: "Cancel"
        }, options);
    
    $.get("templates/areYouSure.html", function(data, textStatus, XMLHttpRequest){
        $.template("areYouSure", data );
        $.tmpl("areYouSure", {}).appendTo( "#content" );

        $('#are_you_sure').modal({});
        
        $("#are_you_sure .modal-title").text(options.title)
        $("#are_you_sure #confirm_button").text(options.confirm_button)
        $("#are_you_sure #cancel_button").text(options.cancel_button)

        $("#are_you_sure #confirm_button").click( function() 
        {
            $('#are_you_sure').modal( 'hide' ).data( 'bs.modal', null );
            callback(true);
        });

        $("#are_you_sure #cancel_button").click( function()
        {
            $('#are_you_sure').modal( 'hide' ).data( 'bs.modal', null );
            callback(false);
        });
    });
}
