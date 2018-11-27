function render_provider_list(smart_assets_api, panels, providers) {

    // if we received only 1 provider, no need to show a list
    if (providers.length == 1) {

        var api = providers[0].id;
        $.getScript("js/" + api + ".js")
                   .done(function (script, textStatus) {
                       new window[api](smart_assets_api, panels, providers);
                   })
                   .fail(function (jqxhr, settings, exception) {
                       panels.CreatePanel($("<div>Cannot find js/" + api + ".js</div>"));
                   });

    } else {
        $.get("templates/provider_table.html", function (data, textStatus, XMLHttpRequest) {
            $.template("provider_table", data);
            var table = $.tmpl("provider_table", {});

            $.get("templates/providers.html", function (data, textStatus, XMLHttpRequest) {
                $.template("providers", data);
                var panelContent = $.tmpl("providers", providers).appendTo(table.find("#provider_table"))

                table.find(".table-row").click(function (row_clicked) {
                    var api = $(row_clicked.target).attr('id');
                    if (api == null)
                        api = $(row_clicked.target).parent().attr('id');
                    $.getScript("js/" + api + ".js")
                    .done(function (script, textStatus) {
                        new window[api](smart_assets_api, panels, providers);
                    })
                    .fail(function (jqxhr, settings, exception) {
                        panels.CreatePanel($("<div>Cannot find js/" + api + ".js</div>"));
                    });


                });

                panels.CreatePanel(table);
            });
        });
    }
}