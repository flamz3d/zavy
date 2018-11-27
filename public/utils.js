var k_max_logitem       = 100;
var k_rmv_logitem       = 20;


// $(window).bind('keydown', function(event) {
//     if (event.ctrlKey || event.metaKey) {
//         switch (String.fromCharCode(event.which).toLowerCase()) {
//             case 'a':
//                 event.preventDefault();
//                 var currentFocus= $("input[type='text']:focus");
//                 if (currentFocus.length)
//                 {
//                     currentFocus.select();
//                 }
//                 break;

//         }
//     }
// });

/**
 * Array Remove
 */
if (!Array.prototype.remove) {
    Array.prototype.remove = function (from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };

}

var utils= {

    serverTimeToDate : function (a_time){
        var d= new Date(a_time * 1000);
        var dt=d.getTimezoneOffset()*60*1000;
        d.setTime(d.getTime() - dt);
        return d;
    },

    isEmbededInUnity : function (){
       return window.unityAsync != undefined;
    },

    throwError: function (a_code, a_message){
        return {code: a_code, msg: a_message};
    },

    dumpLog: function (){
        var $scope= angular.element($("body")).scope();

        if($scope.$$phase) {
            $scope.itlLog(a_type,a_message, a_extraInfo);

        }else{
            $scope.$apply(function(){
                _.each($scope.logItems, function (itm){
                    console.log(itm.type+" "+itm.msg);
                })
            });
        }
    },

    log: function (a_type, a_message, a_extraInfo){
        // var $scope= angular.element($("body")).scope();

        // if ($scope){
        //     if($scope.$$phase) {
        //         $scope.itlLog(a_type,a_message, a_extraInfo);

        //     }else{
        //         $scope.$apply(function(){
        //             $scope.itlLog(a_type,a_message, a_extraInfo);
        //         });
        //     }    
        // }else{
     console.log(a_type + " " + a_message, a_extraInfo)
        //}
        
    },

    info: function (msg, a_extraInfo) {
        this.log('info', msg, a_extraInfo);
    },

    warning: function (msg, a_extraInfo) {
        this.log('warning', msg, a_extraInfo);
    },

    error : function (msg, a_extraInfo) {
        this.log('error', msg, a_extraInfo);
    },

    debug: function (msg, a_extraInfo) {
        this.log('debug', msg, a_extraInfo);
    },

    getExtension: function (a_path){

        var ti = a_path.lastIndexOf('.');
        if (ti==-1){
            return "";
        }
        return a_path.substr(ti+1,a_path.length);
    },

    getFilename: function (a_path){

        var ti = a_path.lastIndexOf('/');
        var pl= a_path.length;

        if (ti == pl-1) {
            a_path= a_path.substr(0,pl-1);
            ti = a_path.lastIndexOf('/');
        }

        if (ti == -1) {
            ti = 0;
        }else{
            ti++;
        }

        var di = a_path.lastIndexOf('.');
        if (di == -1) {
            di = a_path.length;
        }

        return  a_path.substr(ti, di - ti);
    },

    getDirectory: function (a_path){

        var tl= a_path.length;

        if (a_path[a_path.length-1]=="/"){
            tl--;
        }

        var edir= a_path.substr(0,tl);
        var npp= edir.lastIndexOf('/');

        if ((edir=="") || (edir=="/") || (npp==-1)){
            return "";
        }

        return edir.substr(0,npp);
    },

    fixPath: function(a_path){
        if (a_path[a_path.length-1]=='/'){
            return a_path.substr(0,a_path.length-1);
        }

        return a_path;
    },

    pixelToNumber: function (a_pixelSpec){

        if (!a_pixelSpec || a_pixelSpec.length==0){
            return 0;
        }

        var sl= a_pixelSpec.length;

        if (a_pixelSpec.substr(sl-2)=="px"){
            return Number(a_pixelSpec.substr(0,sl-2));
        }

    }

};