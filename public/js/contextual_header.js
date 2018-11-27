var last_header_value = ""

function render_header(sa_api, container, data_change_callback) {
    sa_api.GetConceptName(function (error, conceptName) {

        
        if (conceptName.length) {
            // concept is already defined
            render_concept_header(conceptName, container, data_change_callback);
        } else {
            // show UI to create new concept
            define_new_concept(sa_api, container, data_change_callback);
        }
    })
}

function render_concept_header(concept_name, container, callback) {
    $.get("templates/header_fixed.html", function (data, textStatus, XMLHttpRequest) {
        $.template("header_fixed", data);
        $.tmpl("header_fixed", { name: concept_name }).appendTo(container);
        callback(concept_name);
    });
}

function define_new_concept(sa_api, container, data_change_callback) {
    $.get("templates/contextual_header.html", function (data, textStatus, XMLHttpRequest) {
        $.template("contextual_header", data);
        $.tmpl("contextual_header", {}).appendTo(container);

        var new_concept_panel = container.find("#new_concept_panel");
        var existing_concept_panel = container.find("#existing_concept_panel");

        var concept_input = container.find("#concept");
        var concept_tag = container.find("#concept_tag");

        concept_input.keypress(function (e) {
            if (e.which == 13) {
                concept_input.change();
                return false;
            }
        });

        concept_input.change(function () {

            container.find(".concept_name").text(concept_input.val());

            if (concept_input.val().length > 0) {
                if (last_header_value == concept_input.val())
                    return;
                concept_tag.text(concept_input.val())
                new_concept_panel.fadeOut("fast", function () {
                    existing_concept_panel.fadeIn();
                    data_change_callback(concept_input.val());
                    last_header_value = concept_input.val();
                });

            } else {
                existing_concept_panel.fadeOut("fast", function () {
                    new_concept_panel.fadeIn();
                    data_change_callback(concept_input.val());
                    last_header_value = "";
                });
            }
        });

        var clearButton = container.find("#concept_clear");
        clearButton.click(function () {
            concept_input.val("");
            concept_input.change();
        });
    });
}
