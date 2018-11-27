function DescribeObjectApi(api, panels, providers) {

    console.log("DescribeObjectApi");

    api.GetConceptName(function (error, concept_name) {
        panels.CreatePanelFromTemplate("templates/DescribeObjectApi.html").then(function (html) {
            var isa = html.find('#object_isa');
            isa.tagsinput(
                {
                    trimValue: true,
                    tagClass: function (item) {
                        if (!window.is_automatic_tag)
                            return "custom_tag";
                        return "";
                    }
                }
            );

            // definition text area
            html.find("#next_button").click(function () {
                panels.CreatePanelFromTemplate("templates/TextualDefinition.html").then(function (html) {

                    var button = html.find("#skip_button");
                    var success_ui = html.find("#success_ui");

                    button.click(function () {

                        button.text("")
                        $('<div class="loading"><img src="loading_transparent.gif" style="width:24px; height: auto;"></div>').appendTo(button);

                        // add drama, by waiting one second
                        setTimeout(function () {

                            api.CreateConcept(concept_name, isa.tagsinput("items"), html.find("textarea").val());

                            button.fadeOut("fast", function () {
                                
                                panels.Clear().then(function () {
                                    panels.CreatePanel(success_ui, function () {
                                        success_ui.find("#done_button").click(function () {
                                            api.CloseEditor();
                                        });
                                        success_ui.show();
                                    });
                                });
                            });
                            
                        }, 1800)
                    })

                    html.find(".concept_name").text(concept_name);
                    html.find("textarea").bind('input propertychange', function (t,i) {
                        html.find("#skip_button").text($(t.target).val().length > 0 ? "Finish" : "Skip");
                    });
                });
            });

            html.find(".concept_name").text(concept_name);

            kg_api.synonyms(concept_name).then(
                function (synonyms) {
                    
                    var items = isa.tagsinput("items");
                    synonyms = _.filter(synonyms, function (d) {
                        return items.indexOf(d) < 0;
                    });

                    $("#add_object_modal .loading").hide();
                    _.forEach(synonyms, function (e) {
                        var badge = $("<span class='badge badge-secondary suggestion known'>" + e + "</span>");
                        badge.on("click", function (d) {
                            window.is_automatic_tag = true;
                            isa.tagsinput("add", $(d.target).text());
                            window.is_automatic_tag = false;
                        });
                        badge.appendTo(object_suggestions);
                    });
                }, function (error) { console.log(error); });
            });
    });
}