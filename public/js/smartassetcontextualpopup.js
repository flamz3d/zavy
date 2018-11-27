
panels = new SlidingPanels({ speed: "0.3s" });

function main() {
    api_factory.smartassets().then(function (api) {

        render_header(api, $("#header"), function (concept) {

            panels.Clear().then(function () {

                $("#providers").empty();
                if (concept.length === 0)
                    return;

                api.SetConceptName(concept, function (error) {
                    if (error == null) {
                        api.GetProviders(function (error, providers) {
                            render_provider_list(api, panels, providers);
                        });
                    }
                });
            });
        });
    });
}
