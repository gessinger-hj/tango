var T = require ( "tango" ) ;
fetch = require('node-fetch') ;
var util = require('util');
// var t1 = "%NODE_TEST%-%GEPARD_LOG%" ;
var t1 = "%GEPARD_LOG%" ;
console.log ( "t1=" + t1 ) ;
var t2 = T.resolve ( t1, { GEPARD_LOG: "%GP_LOG%" } ) ;
console.log ( "t2=" + t2 ) ;

async function get_ip() {
	var response = await fetch("http://ipecho.net/plain");
	return  response.text();
}
var ip = get_ip() ;
console.log ( "get_ip()=" + ip.then(function xx (a, b )
	{
		console.log(a);
		console.log(b);
	}) ) ;
