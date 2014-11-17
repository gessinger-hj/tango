var Tail = require('always-tail');
var T = require ( 'Tango' ) ;
// var Tail = require ( './Tail' ) ;
var Event = require ( 'gp/Event' ) ;
var Client = require ( 'gp/Client' ) ;

// var filename = "./log.log";
var filename = "/home/gess/work/poi-3.8/ServiceContainer.ACS.log_1";

filename = T.getProperty ( "file", filename ) ;
console.log ( "filename=" + filename ) ;

var tail = new Tail ( filename ) ;

var gpc = new Client() ;

tail.on ( 'line', function ( data )
{
 	// console.log("got line:", data);
	// var ne = new Event ( "tail:" + this.filename, filename ) ;
	var ne = new Event ( "tail.log", filename ) ;
	// ne.setFailureInfoRequested() ;
	ne.data.text = data.toString() ;
	gpc.fire ( ne, function failure(e)
	{
		// console.log ( e ) ;
	} ) ;
});
// tail.on ( 'line', function ( data )
// {
//  	console.log("got line:", data);
// 	var ne = new Event ( "tail.log", filename ) ;
// 	ne.setFailureInfoRequested() ;
// 	ne.data.text = data.toString() ;
// 	gpc.fire ( ne ) ;
// });


// tail.on('error', function(data) {
//   console.log("error:", data);
// 	tail.unwatch();
// });

tail.watch();

// to unwatch and close all file descriptors, tail.unwatch();
