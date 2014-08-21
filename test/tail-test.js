// var Tail = require('always-tail');
var Tail = require ( './Tail' ) ;
var GPEvent = require ( 'GPEvent' ) ;
var GPClient = require ( 'GPClient' ) ;

// var filename = "./log.log";
var filename = "/home/gess/work/poi-3.8/ServiceContainer.ACS.log_1";

var tail = new Tail ( filename, null ) ;

var gpc = new GPClient() ;

tail.on ( 'line', function ( data )
{
	var ne = new GPEvent ( "tail.log.log", filename ) ;
	ne.data.text = data.toString() ;
	gpc.fire ( ne ) ;
  // console.log("got line:", data);
});


tail.on('error', function(data) {
  console.log("error:", data);
	tail.unwatch();
});

tail.watch();

// to unwatch and close all file descriptors, tail.unwatch();