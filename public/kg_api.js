var kg_api = {
    synonyms: function (w)
    {
        return new Promise(function (fulfill, reject) {
            axios.get("http://18.232.106.244:5000/kg/v1/known_entities/" + w)
                .then(function (response) {
                    fulfill(response.data)
                })
                .catch(function (error) {
                    reject(error);
                })
                .then(function () {
                });
        });
    }
};

function GetUnityKG() {
    return new Promise(function (fulfill, reject) {
        unityObj.getUnityObject("KnowledgeGraph", function (oerr, res) {
            if (oerr) {
                reject(oerr);
            }
            else {

                fulfill(res);
            }

        });
    });
}

function Operations() {
    return new Promise(function (fulfill, reject) {
        unityObj.getUnityObject("Operations", function (oerr, res) {
            if (oerr) {
                console.log(oerr);
                reject(oerr);
            }
            else {
                fulfill(res);
            }
        });
    });
}
