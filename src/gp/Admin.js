var net = require('net');
var Event = require ( "./Event" ) ;
var T = require ( "../Tango" ) ;

/**
 * @constructor
 * @class Admin tool for Gepard
 * @method GPAdmin
 * @param {} port
 * @param {} host
 * @return 
 */
var GPAdmin = function ( port, host )
{
	this.port = T.getProperty ( "gepard.port", port ) ;
	this.host = T.getProperty ( "gepard.host", host ) ;
};
/**
 * Shutdown GPBroker
 * @method shutdown
 * @param {} what
 * @return 
 */
GPAdmin.prototype.shutdown = function ( what )
{
	this._execute ( "shutdown", what ) ;
};
/**
 * Display an info from GPBroker
 * @method info
 * @param {} what
 * @return 
 */
GPAdmin.prototype.info = function ( what )
{
	this._execute ( "info", what ) ;
};
/*
 */
GPAdmin.prototype._execute = function ( action, what )
{
	this.socket = net.connect ( { port: this.port, host: this.host } ) ;
	if ( action === "shutdown" )
	{
		this.socket.on ( "connect", function()
		{
		  var e = new Event ( "system", "shutdown" ) ;
		  this.write ( e.serialize() ) ;
		});
		if ( ! what )
		{
			return ;
		}
	}
	else
	{
		this.socket.on ( "connect", function()
		{
		  var e = new Event ( "system", "getInfoRequest" ) ;
		  e.data.info_type = what ;
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
		var list, i, desc, str, app ;
	  var m = data.toString() ;
	  if ( m.charAt ( 0 ) === '{' )
	  {
	    var e = Event.prototype.deserialize ( m ) ;
	    if ( e.getType() === "getInfoResult" )
	    {
	    	if ( what === "lsconn" )
	    	{
	    		list = e.data.connectionList ;
	    		if ( ! list || ! list.length )
	    		{
	    			console.log ( "No Connections" ) ;
	    		}
	    		else
	    		{
		    		for ( i = 0 ; i < list.length ; i++ )
		    		{
		    			desc = list[i] ;
		    			str = desc.application ;
		    			app = str.substring ( str.lastIndexOf ( '/' ) + 1, str.lastIndexOf ( '.' ) ) ;
		    			console.log ( "%s\t%s:%s", desc.sid, desc.hostname, app ) ;
		    		}
		    	}
	    	}
	    	else
	    	if ( what === "lslock" )
	    	{
	    		list = e.data.lockList ;
	    		if ( ! list || ! list.length )
	    		{
	    			console.log ( "No locks" ) ;
	    		}
	    		else
	    		{
		    		for ( i = 0 ; i < list.length ; i++ )
		    		{
		    			desc = list[i] ;
		    			str = desc.owner.application ;
		    			app = str.substring ( str.lastIndexOf ( '/' ) + 1, str.lastIndexOf ( '.' ) ) ;
		    			console.log ( "%s\t%s\t%s:%s", desc.resourceId, desc.owner.sid, desc.owner.hostname, app ) ;
		    		}
	    		}
	    	}
	    	else
	    	{
	    		T.log ( e ) ;
	    	}
	    }
	    else
	    {
		    T.log ( e ) ;
	    }
	  }
	  this.end();
	});
};
module.exports = GPAdmin ;
if ( require.main === module )
{
	var ad = new GPAdmin() ;
	var what = T.getProperty ( "shutdown" ) ;
	if ( what )
	{
		if ( what === "true" ) what = null ;
		ad.shutdown ( what ) ;
		return ;
	}
	what = T.getProperty ( "info" ) ;
	if ( what && what !== "true" )
	{
		ad.info ( what ) ;
		return ;
	}
	ad.info() ;
	return ;
}
