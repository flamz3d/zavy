function RenderTemplate(path, container) {

    var self = this;
    return new Promise(function (fulfill, reject) {
        $.get(path, function (data, textStatus, XMLHttpRequest) {
            $.template(path, data);
            var html = $.tmpl(path, data);
            html.appendTo(container);
            fulfill();
        });
    });
}