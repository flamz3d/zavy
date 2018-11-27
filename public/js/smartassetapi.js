var api_factory = {
    smartassets: function (w)
    {
        return new Promise(function (fulfill, reject) {
            unityObj.getUnityObject("UnityAPI_SmartAssets", function (oerr, res) {
                if (oerr) reject(oerr)
                else fulfill(res);
            });
        });
    },
    get: function (api_name) {
        return new Promise(function (fulfill, reject) {
            unityObj.getUnityObject(api_name, function (oerr, res) {
                if (oerr) reject(oerr)
                else fulfill(res);
            });
        });
    }
};

var searchSlot = {

    _callbacks : {},
    on: function (searchToken, callback) {
        this._callbacks[searchToken] = callback;
    },

    signal: function (searchToken, results) {
        var callback = this._callbacks[searchToken];
        if (callback !== null)
            callback(results);
    }
};