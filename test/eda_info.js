var net = require('net');
var NEvent = require ( "NEvent" ) ;
var T = require ( "Tango" ) ;

var port = T.getProperty ( "gepard.port", 17501 ) ;
var host = T.getProperty ( "gepard.host" ) ;

var socket = net.connect ( { port: port, host: host } ) ;

if ( T.getProperty ( "shutdown" ) )
{
	socket.on ( "connect", function()
	{
	  var e = new NEvent ( "system", "shutdown" ) ;
	  this.write ( e.serialize() ) ;
	});
}
else
{
	socket.on ( "connect", function()
	{
	  var e = new NEvent ( "system", "getInfoRequest" ) ;
	  this.write ( e.serialize() ) ;
	});
}
socket.on ( 'data', function ( data ) {
  var m = data.toString() ;
  if ( m.charAt ( 0 ) === '{' )
  {
    var e = T.deserialize ( m ) ;
    T.log ( e ) ;
  }
  this.end();
});
