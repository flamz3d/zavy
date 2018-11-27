var current_page = 0;
var current_search_token = "";

function MeshProviderAPI(api, panels, providers) {

    current_page = 0;
    current_search_token = "";
    // get first page of suggestions
    api_factory.get("MeshProviderAPI").then(function (meshApi) {

        $.get("templates/imageGallery.html", function (data, textStatus, XMLHttpRequest) {
            $.template("imageGallery", data);
            var imageGallery = $.tmpl("imageGallery", {});
            panels.CreatePanelFromTemplate("templates/MeshProviderAPI.html").then(function (html) {

                imageGallery.appendTo(html.find("#imageGallery"));
                var imgs = imageGallery.find(".suggestion")
                                        .attr("width", "77px")
                                        .attr("height", "77px")
                                        .css("background-color", "#111111")
                                        .click(function (s) {
                                            var clickedImage = $(s.target);
                                            var previewImage = imageGallery.find(".preview");
                                            previewImage.attr("src", clickedImage.attr("src"))
                                            previewImage.attr("title", clickedImage.attr("title"))
                                            previewImage.attr("url", clickedImage.attr("url"))
                                            previewImage.trigger('load');
                                            imageGallery.find(".preview_container").show();
                                        })
                                        .dblclick(function (s) {
                                            var clickedImage = $(s.target);
                                            clickedImage.attr("url")
                                            SearchSimilarTo(clickedImage.attr("url"), meshApi, imageGallery);
                                        });

                imageGallery.find("#previous_page").click(function ()
                {
                    current_page--;
                    if (current_page < 0)
                        current_page = 0;
                    FetchPage(meshApi, imageGallery)
                });

                imageGallery.find("#next_page").click(function ()
                {
                    current_page++;
                    FetchPage(meshApi, imageGallery)
                });

                imageGallery.find("#select_button").click(function (e) {
                    var previewImage = imageGallery.find(".preview");
                    meshApi.InstanciateSuggestion(current_search_token, previewImage.attr("url"));
                });
               
                imageGallery.find("#vary_button").hide();

                searchSlot.on("OnPreviewTextureUpdated", function () {
                    FetchPage(meshApi, imageGallery);
                });
               
                setTimeout(function () {
                    FetchPage(meshApi, imageGallery);
                }, 100);

            });
        });
        
    });
}

function SearchSimilarTo(url, meshApi, imageGallery)
{
    current_page = 0;
    current_search_token = "";
    meshApi.SearchOnlySimilarTo(url);
    FetchPage(meshApi, imageGallery)
}

function FetchPage(meshApi, imageGallery) {

    var imgs = imageGallery.find(".suggestion");
    
    meshApi.Suggest(current_page, 9, current_search_token, function (e, searchToken) {

        current_search_token = searchToken;
        searchSlot.on(searchToken, function (suggestions) {

            imgs.on('load', function () {

            }).each(function (i) {
                if (this.complete) {
                    if (i >= suggestions.length) {
                        $(this).hide();
                    } else {
                        $(this).show();
                        $(this).attr("src", suggestions[i].base64PreviewImage);
                        $(this).attr("title", suggestions[i].name);
                        $(this).attr("url", suggestions[i].url);
                        $(this).attr("allo", "world");
                        $(this).trigger('load');
                    }
                }
            });
        });
    });
}