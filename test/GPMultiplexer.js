var net = require('net');
var os = require('os');
var GPEvent = require ( "./GPEvent" ) ;
var T = require ( "./Tango" ) ;

var port = T.getProperty ( "gepard.port", 17501 ) ;
var host = T.getProperty ( "gepard.host" ) ;

var socket1 ;
var socket2 ;
try
{
	socket1 = net.connect ( { port: port, host: "wevli154" } ) ;
}
catch ( exc )
{
	console.log ( "socket1 --------------" ) ;
	console.log ( exc ) ;
}
try
{
	 socket2 = net.connect ( { port: port, host: "wevli077" } ) ;
}
catch ( exc )
{
	console.log ( "socket2 --------------" ) ;
	console.log ( exc ) ;
}

console.log ( "---------------------" ) ;
var socket1_connected = false ;
var socket2_connected = false ;
var to_socket1_list = [] ;
var to_socket2_list = [] ;

socket1.on ( "connect", function socket1_on_connect()
{
	this.on ( 'error', function socket1_on_error( data )
	{
		T.log ( data ) ;
	});
	this.on ( 'end', function socket1_on_end( data )
	{
	});
	socket1_connected = true ;
  var einfo = new GPEvent ( "system", "client_info" ) ;
  einfo.data.hostname = os.hostname() ;
  einfo.data.connectionTime = new Date() ;
  einfo.data.application = process.argv[1] ;
  this.write ( einfo.serialize() ) ;

  var e = new GPEvent ( "system", "addMultiplexer" ) ;
	this.write ( e.serialize() ) ;

	if ( to_socket1_list.length )
	{
		for ( var i = 0 ; i < to_socket1_list.length ; i++ )
		{
			socket1.write ( to_socket1_list[i] ) ;
		}
		to_socket1_list.length = 0 ;
	}
});
socket2.on ( "connect", function socket2_on_connect()
{
	this.on ( 'error', function socket1_on_error( data )
	{
		T.log ( data ) ;
	});
	this.on ( 'end', function socket1_on_end( data )
	{
	});
  var einfo = new GPEvent ( "system", "client_info" ) ;
  einfo.data.hostname = os.hostname() ;
  einfo.data.connectionTime = new Date() ;
  einfo.data.application = process.argv[1] ;
  this.write ( einfo.serialize() ) ;
	socket2_connected = true ;
  var e = new GPEvent ( "system", "addMultiplexer" ) ;
	this.write ( e.serialize() ) ;

	if ( to_socket2_list.length )
	{
		for ( var i = 0 ; i < to_socket2_list.length ; i++ )
		{
			socket1.write ( to_socket2_list[i] ) ;
		}
		to_socket2_list.length = 0 ;
	}
});
socket1.on ( 'data', function socket1_on_data( data )
{
	if ( socket2_connected )
	{
		socket2.write ( data ) ;
		return ;
	}
	to_socket2_list.push ( data ) ;
});
socket2.on ( 'data', function socket2_on_data( data )
{
	if ( socket1_connected )
	{
		socket1.write ( data ) ;
		return ;
	}
	to_socket1_list.push ( data ) ;
});
