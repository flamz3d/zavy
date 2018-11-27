function SlidingPanels(options) {
    this.options = _.extend(
        {
            speed: "0.4s",
        }, options);
    this.panels = [];
    this.name = name;
}

SlidingPanels.prototype.CreatePanel = function (content, cb) {

    var self = this;
    self.MakeRoomForNextPanel().then(function () {

        var newPanel = $("<div class='panel'></div>").appendTo("#providers");
        newPanel.css({ transition: 'all ' + self.options.speed + ' ease 0.0s' });

        self.panels.push(newPanel);
        content.appendTo(newPanel);

        var addBackButton = self.panels.length > 1;
        if (addBackButton) {
            var backButton = $('<div><i class="fas fa-angle-double-left"></i><div>').click(function () {
                self.ShowPreviousPanel().then(function () {
                });
            });
            backButton.appendTo(newPanel);
        }

        if (cb != null) {
            cb(newPanel)
        }

        setTimeout(function () {
            newPanel.get()[0].style.left = "0px";
        }, 100);
    });
}

SlidingPanels.prototype.CreatePanelFromTemplate = function (templateFilename, data) {

    var self = this;
    return new Promise(function (fulfill, reject) {
        $.get(templateFilename, function (data, textStatus, XMLHttpRequest) {
            $.template(templateFilename, data);
            var html = $.tmpl(templateFilename, data);
            self.CreatePanel(html, function (panel) {
                fulfill(panel);
            });
        });
    });
}

SlidingPanels.prototype.VisiblePanel = function () {
    var topPanel = this.panels[this.panels.length - 1];
    return topPanel.get()[0];
}

SlidingPanels.prototype.MakeRoomForNextPanel = function() {

    var self = this;
    return new Promise(function (fulfill, reject) {
        if (self.panels.length == 0) {
            fulfill();
            return;
        }

        self.VisiblePanel().style.left = "-300px";

        setTimeout(function () {
            fulfill();
        }, 400);
    });
}

SlidingPanels.prototype.ShowPreviousPanel = function() {

    var self = this;
    return new Promise(function (fulfill, reject) {
        if (self.panels.length < 2) {
            fulfill();
            return;
        }

        self.VisiblePanel().style.left = "300px";

        setTimeout(function () {
            panelToDestroy = self.panels.pop();
            panelToDestroy.remove();
            self.VisiblePanel().style.left = "0px";
            fulfill();
        }, 400);
    });
}

SlidingPanels.prototype.Clear = function () { 

    var self = this;
    return new Promise(function (fulfill, reject) {
        if (self.panels.length == 0) {
            fulfill();
            return;
        }

        self.VisiblePanel().style.opacity = "0";

        setTimeout(function () {
            self.panels = [];
            fulfill();
        }, 400);
    });
}

function main() {

    SlidingPanels = new SlidingPanels({});

    contextual_header($("#header"), function (concept) {

        SlidingPanels.Clear().then(function () {
            $("#providers").empty();

            if (concept.length > 0) {

                $.get("templates/imageGallery.html", function (data, textStatus, XMLHttpRequest) {
                    $.template("imageGallery", data);
                    var panelContent = $.tmpl("imageGallery", {});
                    SlidingPanels.CreatePanel(panelContent);
                });

                /*createPanel(function (cb) {

                    $.get("templates/imageGallery.html", function (data, textStatus, XMLHttpRequest) {
                        $.template("imageGallery", data);
                        cb($.tmpl("imageGallery", {}));//.appendTo("#providers");
                    });

                });*/

                api_factory.smartassets().then(function (api) {
                    update_providers(api, $("#providers"), concept);
                });
            }
        });
    });
}
