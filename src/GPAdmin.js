var net = require('net');
var GPEvent = require ( "./GPEvent" ) ;
var T = require ( "./Tango" ) ;

var port = T.getProperty ( "gepard.port", 17501 ) ;
var host = T.getProperty ( "gepard.host" ) ;

var socket = net.connect ( { port: port, host: host } ) ;

if ( T.getProperty ( "shutdown" ) )
{
	socket.on ( "connect", function()
	{
	  var e = new GPEvent ( "system", "shutdown" ) ;
	  this.write ( e.serialize() ) ;
	});
}
else
{
	socket.on ( "connect", function()
	{
T.lwhere (  ) ;
	  var e = new GPEvent ( "system", "getInfoRequest" ) ;
	  this.write ( e.serialize() ) ;
	});
}
socket.on ( 'error', function socket_on_error( data ) {
T.lwhere (  ) ;
T.log ( data ) ;
});
socket.on ( 'end', function socket_on_end( data ) {
// T.lwhere (  ) ;
});
socket.on ( 'data', function ( data ) {
  var m = data.toString() ;
  if ( m.charAt ( 0 ) === '{' )
  {
    var e = GPEvent.prototype.deserialize ( m ) ;
    T.log ( e ) ;
  }
  this.end();
});
