// ugh...
window.is_automatic_tag = false;

function addObject() {

    console.log("alll")
    this.last_value = "";
    var self = this;
    $.get("templates/addObject.html", function (data, textStatus, XMLHttpRequest) {
        $.template("addObject", data );
        $.tmpl("addObject", {}).appendTo( "#content" );

        $('#add_object_modal').modal({});
        self.selected_tags = $('#object_isa');
        self.suggested_tags = $("#object_suggestions");

        self.selected_tags.tagsinput(
            {
                trimValue: true,
                tagClass: function(item) {
                    if (!window.is_automatic_tag)
                        return "custom_tag";
                    return "";
                }
            }
        );

        $("#object_name").change(function() 
        {
            var new_value = $("#object_name").val();
            if (new_value == self.last_value) {
                return;
            }
            self.last_value = new_value;
            $("#definition").hide();
            $("#new_definition").hide();

            if (new_value.length > 0) {
                $("#categories").show()
            } else {
                $("#categories").hide()
            }
            self.selected_tags.tagsinput("removeAll");
            populateSuggestions(self.selected_tags, new_value);
        });

        self.selected_tags.on('itemAdded', function (event)
            { 
                if (window.is_automatic_tag)
                    return;
                populateSuggestions(self.selected_tags, $("#object_name").val());
        });

        self.selected_tags.on('itemRemoved', function (event) {
            populateSuggestions(self.selected_tags, $("#object_name").val());
        });
        
        $("#add_object_modal #create_button").click( function() 
        {
            $('#add_object_modal').modal( 'hide' ).data( 'bs.modal', null );
            GetUnityKG().then(function (kg) {
                kg.AddEntity($("#object_name").val(), self.selected_tags.tagsinput("items"), function (error) {
                    
                });
            });
        });

        $("#add_object_modal #delete_button").click( function()
        {
            GetUnityKG().then ( function (kg) {
                kg.DeleteEntity($("#object_name").val(), function (error) {

                    $("#object_name").val("");
                    $("#object_name").change()
                    
                });
            });
        });
    });
}

function populateSuggestions(isa, item) {

    var object_suggestions = $("#object_suggestions");
    object_suggestions.empty();
    if (item.length==0)
        return;

    $("#add_object_modal .loading").show();
    
    GetUnityKG().then(function (kg) {
        
                kg.GetEntityRelations($("#object_name").val(), "IsA", function (error, relations) {
                    
                    var object_suggestions = $("#object_suggestions");
                    object_suggestions.empty();

                    $("#test_modal .bootstrap-tagsinput input").attr("placeholder", "").val("").focus().blur();
                    window.is_automatic_tag = true;
                    _.forEach(relations, function(r)
                    {
                        isa.tagsinput("add", r);
                    });
                    window.is_automatic_tag = false;
                    
                    kg_api.synonyms(item).then( function(synonyms) {

                        var items = isa.tagsinput("items");
                        synonyms = _.filter(synonyms, function(d) {
                            return items.indexOf(d) < 0;
                        });
                        
                        
                        $("#add_object_modal .loading").hide();
                        _.forEach(synonyms, function(e) {
                            var badge = $("<span class='badge badge-secondary suggestion known'>" + e + "</span>");
                            badge.on("click", function(d) {
                                window.is_automatic_tag = true;
                                isa.tagsinput("add",  $(d.target).text());
                                window.is_automatic_tag = false;
                            });
                            badge.appendTo(object_suggestions);
                        });
                    });

                    kg.GetEntityRelations($("#object_name").val(), "Definition", function (error, definitions) {
                        if (definitions.length>0)
                        {
                            $("#create_button").text("Start Editing '" + $("#object_name").val() + "'");
                            $("#existing_definition").text(definitions[0].replace(/_/g, " "));
                            $("#definition").show();
                            $("#delete_button").show();
                        } else {
                            $("#create_button").text("Create Concept '" + $("#object_name").val() + "'");
                            $("#new_definition").show();
                            $("#delete_button").hide();
                        }
                    });

                });
            });
    
}