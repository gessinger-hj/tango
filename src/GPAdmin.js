var net = require('net');
var GPEvent = require ( "./GPEvent" ) ;
var T = require ( "./Tango" ) ;

/**
 * @class Admin tool for Gepard
 * @constructor
 * @param {string|int} port
 * @param {string} [host]
 */
var GPAdmin = function ( port, host )
{
	this.port = T.getProperty ( "gepard.port", port ) ;
	this.host = T.getProperty ( "gepard.host", host ) ;
};
/**
 * Shutdown GPBroker
 */
GPAdmin.prototype.shutdown = function()
{
	this._execute ( "shutdown" ) ;
};
/**
 * Display an info from GPBroker
 */
GPAdmin.prototype.info = function()
{
	this._execute ( "info" ) ;
};
/*
 */
GPAdmin.prototype._execute = function ( action )
{
	this.socket = net.connect ( { port: this.port, host: this.host } ) ;
	if ( action === "shutdown" )
	{
		this.socket.on ( "connect", function()
		{
		  var e = new GPEvent ( "system", "shutdown" ) ;
		  this.write ( e.serialize() ) ;
		});
		return ;
	}
	else
	{
		this.socket.on ( "connect", function()
		{
		  var e = new GPEvent ( "system", "getInfoRequest" ) ;
		  this.write ( e.serialize() ) ;
		});
	}
	this.socket.on ( 'error', function socket_on_error( data )
	{
		T.lwhere (  ) ;
		T.log ( data ) ;
	});
	this.socket.on ( 'end', function socket_on_end( data )
	{
		// T.lwhere (  ) ;
	});
	this.socket.on ( 'data', function ondata ( data )
	{
	  var m = data.toString() ;
	  if ( m.charAt ( 0 ) === '{' )
	  {
	    var e = GPEvent.prototype.deserialize ( m ) ;
	    T.log ( e ) ;
	  }
	  this.end();
	});
};
module.exports = GPAdmin ;
if ( require.main === module )
{
	var ad = new GPAdmin() ;
	ad.info() ;
}