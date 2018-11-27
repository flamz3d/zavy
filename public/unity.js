
window.onbeforeunload = function (e) {
    if (unityObj.m_isRemote){
        if (unityObj.timeoutID){
            clearTimeout(unityObj.timeoutID);
        }

        unityObj.closeSocket();
    }
};


var unityObj = {

    k_protocolVersion: "1.0",
    k_serviceName: 'json-rmc',
    k_typGetStubInfo: 'GETSTUBINFO',
    k_typInvoke: 'INVOKE',
    k_typOnEvent: 'ONEVENT',
    k_typGlobalEvent: 'GLOBALEVENT',
    k_connectionTimout: 5000,

    k_errNoDirectUnityObject: 'no-unity-object',
    k_remoteAddress: 'localhost',
    k_remotePort: 8789,

    m_requestID: 1,
    m_isRemote: !utils.isEmbededInUnity(),
    m_wsConnection: null,

    m_requestCallbacks: {},
    m_eventCallbacks: {},
    m_waitingEvents: {},

    m_requestHistory: [],

    closeSocket: function (){
        if(this.m_wsConnection){
            this.m_wsConnection.onopen= function(){};
            this.m_wsConnection.onclose= function(){};
            this.m_wsConnection.onerror= function(){};
            this.m_wsConnection.onmessage= function(){};
            if (this.isSocketConnected()){
                this.m_wsConnection.close();
            }

            this.m_wsConnection= null;
        }
    },

    /**
     * Open the websocket connection to the unity engine
     * @param a_callback (optional) function to call when connection is completed with null as params if all went well
     * or an error description if the connection failed.
     */
    initializeSocket: function (a_callback){

        var _caller= this;

        this.m_wsConnection= new WebSocket('ws://'+this.k_remoteAddress+':'+this.k_remotePort+'/'+this.k_serviceName, []);

        unityObj.timeoutID= setTimeout(function (){
            if (!_caller.isSocketConnected()){
                _caller.closeSocket();
                a_callback("Cannot connect to the Unity engine, Is the editor running?");
            }
        },this.k_connectionTimout);


        this.m_wsConnection.onopen = function () {

            if (a_callback){
                a_callback(null);
            }
        };


        this.m_wsConnection.onclose = function () {
            _caller.closeSocket();

        };

        this.m_wsConnection.onerror = function (error) {
            if (a_callback){
                a_callback(error);
            }else{
                utils.error("Couldn't process response from the unity engine",error);
            }
        };

        this.m_wsConnection.onmessage = function (e) {
            try {
                _caller.processResult(e.data);
            }catch(e){
                utils.error("Couldn't process response from the unity engine",e);
            }
        };
    },

    /**
     * check if connection is ready to be used
     * @return {Boolean} true if the connection is open, false otherwise
     */
    isSocketConnected: function (){
        if (!this.m_wsConnection){
            return false;
        }

        return (this.m_wsConnection.readyState == WebSocket.OPEN);
    },

    findRequestHistory : function (a_id){
       return  _.find (this.m_requestHistory, function (itm){
            return itm.messageID= a_id;
        });
    },

    makeReplyData: function (a_exception,a_reply){
        return {exception:a_exception,serverReply:a_reply,originalCall:this.findRequestHistory(a_reply.messageID)};
    },

    cancelEvent: function (a_eventName){

        var _caller= this;

        _.find(this.m_eventCallbacks, function (itm, k){

            if (itm.event = a_eventName){
                delete _caller.m_eventCallbacks[k];
                return true;
            }
            return false;
        });


        _.find(this.m_waitingEvents, function (itm, k){

            if (itm.info.event==a_eventName)
                delete _caller.m_waitingEvents[k];
            return true;
        });

        return false;
    },

    cancelEvents: function (){

        this.m_eventCallbacks.length= 0;

        var waitingEventsCopy = _.map(this.m_waitingEvents, function (itm,k){
            return itm.callback;
        });

        this.m_waitingEvents.length= 0;

        _.each (waitingEventsCopy, function (itm){
            itm({cancelled:true});
        });
    },

    /**
     *
     */
    processResult: function (a_result){

        var robj= null;
        var _caller= this;
        try {

            var robj = a_result;
            if (typeof a_result == "string") 
                robj= JSON.parse(a_result);
        }catch(ex){
            utils.error("Couldn't parse the reply from the unity engine",ex);
        }

        if (robj.type == this.k_typGlobalEvent){
            console.log("Global event received: ", robj.event);
            this.cancelEvents();
            return;
        }

        var cbk= this.m_requestCallbacks[robj.messageID];

        if (cbk != undefined){
            // remove callback from list
            delete this.m_requestCallbacks[robj.messageID];
        }else{
            cbk= this.m_eventCallbacks[robj.messageID];
        }

        if (robj.status < 0){
			//console.error("processResult error: ", robj);
            if (cbk){
                cbk(robj,null);
            }
            return;
        }

        var cres= null;

        if (robj.type == this.k_typGetStubInfo){
            var stub= {};

            stub.events= robj.result.events;
            _.each(robj.result.properties, function (itm,k){
                stub[itm.name]= itm.value;
            });

            _.each(robj.result.methods, function (itm, k) {
                if (itm.name !== undefined) {
                    stub[itm.name] = function () {

                        //if (arguments.length < 1){
                        //utils.debug("last argument is not of type function for callback, callback ignored",_caller.makeReplyData(null,robj));

                        //}

                        var callback = null;

                        if (typeof arguments[arguments.length - 1] != "function") {
                            //utils.debug("last argument is not of type function for callback, callback ignored",_caller.makeReplyData(null,robj));

                        } else {
                            callback = arguments[arguments.length - 1];
                        }

                        var callInfo = {
                            type: _caller.k_typInvoke,
                            destination: robj.reference,
                            method: itm.name,
                            params: []
                        };

                        for (var i = 0; i < arguments.length - (callback ? 1 : 0) ; i++) {
                            callInfo.params.push(arguments[i]);
                        }

                        _caller.callProxyMgr(callInfo, callback);
                    }
                }
            });
            
            stub.on = function (a_event, a_callback) {
                if (this.events.indexOf(a_event) == -1){
                    throw "Cannot register to unknown event <"+a_event+">";
                }

                var callInfo= {
                    type: _caller.k_typOnEvent,
                    destination: robj.reference,
                    event: a_event
                };

                _caller.callProxyMgr(callInfo,a_callback);
            };

            stub.off= function (a_eventName){
                _caller.cancelEvent(a_eventName);
            };

            cres = stub;
        }else if (robj.type == this.k_typInvoke){
            cres= robj.result;

        }else if (robj.type == this.k_typEvent){
            cres= robj.result;
        }


        try {
            if (cbk) {
                cbk(null,cres);
            }
        }catch (e){
            utils.error("An error occured in the callback for the request", this.makeReplyData(e,robj));
        }
    },

    /**
     *
     * @param a_callInfo
     * @param a_callback
     */
    callProxyMgr: function (a_callInfo,a_callback){

        var _caller = this;
		
        a_callInfo.version= this.k_protocolVersion;
        a_callInfo.messageID= this.m_requestID++;

        if (a_callInfo.type==this.k_typOnEvent){
            this.m_eventCallbacks[a_callInfo.messageID]= a_callback;
            this.m_waitingEvents[a_callInfo.messageID]= {info:a_callInfo, callback: a_callback};
        }else{
            this.m_requestCallbacks[a_callInfo.messageID]= a_callback;
        }


        this.m_requestHistory.push(a_callInfo);

        if (this.m_requestHistory.length > k_max_logitem){
            this.m_requestHistory.splice(0, k_rmv_logitem);
        }

        if (unityObj.m_isRemote){
            
            $.ajax({
                url: '/unity/engine/proxy',
                data: JSON.stringify(a_callInfo),
                success: function (response){
                    unityObj.processResult(response);
                    console.log(response);
                },
                error: function( jqXHR, textStatus, errorThrown ){
                    console.log(textStatus);
                },
                type: 'POST',
                dataType: "json"
            });
        }else{
            
			window.unityAsync({
							className: 'window.webScriptObject',
							funcName: 'ProcessMessage',
							funcArgs: [JSON.stringify(a_callInfo)],
							onSuccess: function (response) {
							    
									 unityObj.processResult(response);
							},
							onError: function (response) {
							    alert("onError");
							}
					});
        }
    },

    /**
     * getUnityObject
     * retreive a stub to talk to a unity c# object
     * @param a_reference
     * @param a_callback
     */
    getUnityObject : function (a_reference, a_callback){
        var _caller= this;

        var ocallInfo = {
            type: this.k_typGetStubInfo,
            reference: a_reference
        };

        this.callProxyMgr(ocallInfo,a_callback);
    },

    onEvent : function (event, data){
        console.log(event+" "+data);
    }

};

/*
function testEvent(callback) {

    unityObj.getUnityObject("unity.ontology", function (oerr, res) {
        if (oerr) {
            console.error(oerr);
        } else {

          res.events["SomeIntEvent"](9);
        }
    });
}*/
function testUnityObject(callback) {
    
    unityObj.getUnityObject("unity.blockly", function (oerr, res) {

        if (oerr) {
            callback(oerr);
            console.error(oerr);
            return;
        } else {

            callback(JSON.stringify(res, null, 4));
            //callback(res.ontology.classes.length);
        }

        var r = res.getServerURL(function (err,ars){
            if (err) {
                callback("Error: ", err);
                console.error("Error: ", err);
                return;
            }
            
            console.log("Server URL: ", ars);
        });
    });
}

function unityData(callback) {

    if (unityObj.m_isRemote) {
        var defaultOntology = [
            { "value": 1, "sets": [1], "fullname": "remote2 >> allo", "label": "remote", "size": 0.7 },
            { "value": 2, "sets": [2], "fullname": "remote3 >> allo", "label": "remote1", "size": 3 },
            { "value": 3, "sets": [3], "fullname": "remote4 >> allo", "label": "remote2", "size": 3 },
            { "value": 4, "sets": [4], "fullname": "remote5 >> allo", "label": "remote3", "size": 0.2 },
            { "value": 5, "sets": [5], "fullname": "remote56 >> allo", "label": "remote4", "size": 3 },
            { "value": 6, "sets": [6], "fullname": "remote22 >> allo", "label": "remote5", "size": 0.2 },
            { "value": 7, "sets": [7], "fullname": "remote8 >> allo", "label": "remote6", "size": 0.2 },
            { "value": 8, "sets": [8], "fullname": "remote9 >> allo", "label": "remote7", "size": 2 },
            { "value": 9, "sets": [9], "fullname": "remote77 >> allo", "label": "remote8", "size": 0.2 },
            { "value": 10, "sets": [1, 4], "size": 1 },
            { "value": 11, "sets": [2, 1], "size": 1 },
            { "value": 12, "sets": [2, 4], "size": 1 },
            { "value": 13, "sets": [2, 9], "size": 1 },
            { "value": 14, "sets": [3, 1], "size": 1 },
            { "value": 15, "sets": [3, 4], "size": 1 },
            { "value": 16, "sets": [3, 6], "size": 1 },
            { "value": 17, "sets": [5, 4], "size": 1 },
            { "value": 18, "sets": [5, 6], "size": 1 },
            { "value": 19, "sets": [5, 7], "size": 1 },
            { "value": 20, "sets": [8, 7], "size": 1 },
            { "value": 21, "sets": [8, 9], "size": 1 }]
        callback(null, { "ontology": { "classes": defaultOntology } });
        return;
    }

    unityObj.getUnityObject("unity.ontology", function (oerr, res) {

        res.UpdateOntology("allo", [1,2,3,4]);
        callback(oerr, res);
    });
}

function testParams (){
    unityObj.getUnityObject("editor.global.aes", function (oerr, res){

        if (oerr){
            utils.error(oerr);
            return;
        }

        var r = res.update(['dsfsdf','swerwert'],function (err,ars){
            if (err){
                utils.error("Error: " + err.message, err);
                return;
            }
            console.log("Server URL: ", ars);
        });
    });
}

window.unityObj= unityObj;
window.unityOnEvent = function(arg) {
    window.unityObj.processResult(arg);
};
