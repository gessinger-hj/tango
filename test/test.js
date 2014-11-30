// var t = require ( "../index.js" ) ;
//t._displayLoadedModules() ;

//var c = new t.gp.Client() ;

var T = require ( "Tango" ) ;
// var t1 = "%NODE_TEST%-%GEPARD_LOG%" ;
var t1 = "%GEPARD_LOG%" ;
console.log ( "t1=" + t1 ) ;
var t2 = T.resolve ( t1, { GEPARD_LOG: "%GP_LOG%" } ) ;
console.log ( "t2=" + t2 ) ;
