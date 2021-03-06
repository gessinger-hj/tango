#!/usr/bin/env node
tango            = require ( "tango" ) ;
var T            = tango ;
var File         = tango.File ;
var ExtTail      = require('always-tail');
var EventEmitter = require ( "events" ).EventEmitter ;
var util         = require ( "util" ) ;

var Tail = function ( fileName )
{
  EventEmitter.call ( this ) ;
	this.fileName = fileName ;
  var f = new File ( this.fileName ) ;
  var start = f.length() - 512 ;
  if ( start < 0 ) start = 0 ;
  var opts = { start: start, interval: 1000 } ;
	this.exttail = new ExtTail ( fileName, null, opts ) ;
};
util.inherits ( Tail, EventEmitter ) ;
Tail.prototype.toString = function()
{
	return "(Tail)[fileName=" + this.fileName + "]" ;
};
Tail.prototype.getFileName = function()
{
	return this.fileName ;
};
Tail.prototype.on = function ( eventName, callback )
{
	this.exttail.on ( eventName, callback ) ;
};
Tail.prototype.watch = function()
{
	this.exttail.watch() ;
};
Tail.prototype.unwatch = function()
{
	this.exttail.unwatch() ;
};
module.exports = Tail ;

if ( require.main === module )
{
	var i = 0 ;
  // var t = new Tail ( "/home/gess/NGMD/Test/Converter.monitoring.log" ) ;
  var t = new Tail ( process.argv[2] ) ;
  t.on ( "line", function online(data)
  {
  	console.log ( data ) ;
  // 	i++ ;
  // 	console.log ( "i=" + i ) ;
  // 	if ( i === 11 )
  // 	{
  // 		t.unwatch() ;
		//   t = new Tail ( "Tail.log" ) ;
		//   t.on ( "line", function online(data)
		//   {
		//   	console.log ( data ) ;
		//   	i++ ;
		//   	console.log ( "--i=" + i ) ;
		//   });
		// }
	});
}
