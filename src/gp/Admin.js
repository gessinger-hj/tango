var net = require('net');
var Event = require ( "./Event" ) ;
var T = require ( "../Tango" ) ;

/**
 * @constructor
 * @class Admin tool for Gepard
 * @method Admin
 * @param {} port
 * @param {} host
 * @return 
 */
var Admin = function ( port, host )
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
Admin.prototype.shutdown = function ( what )
{
	this._execute ( "shutdown", what ) ;
};
/**
 * Display an info from GPBroker
 * @method info
 * @param {} what
 * @return 
 */
Admin.prototype.info = function ( what )
{
	this._execute ( "info", what ) ;
};
/*
 */
Admin.prototype._execute = function ( action, what )
{
	try
	{
		this.socket = net.connect ( { port: this.port, host: this.host } ) ;
	}
	catch ( exc )
	{
		console.log ( "Not running" ) ;
		return ;
	}
	if ( action === "shutdown" )
	{
		this.socket.on ( "connect", function()
		{
		  var e = new Event ( "system", "shutdown" ) ;
		  if ( what )
		  {
		  	e.data.shutdown_sid = what ;
		  }
		  this.write ( e.serialize() ) ;
		  if ( ! what )
		  {
		  	return ;
		  }
		});
		// return ;
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
		console.log ( "Not running" ) ;
		// T.lwhere (  ) ;
		// T.log ( data ) ;
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
module.exports = Admin ;
if ( require.main === module )
{
	var ad = new Admin() ;
	var what = T.getProperty ( "shutdown" ) ;
	if ( what )
	{
		if ( what === "true" ) what = null ;
		ad.shutdown ( what ) ;
		return ;
	}
	what = T.getProperty ( "info", "true" ) ;
	T.lwhere ( "what=" + what ) ;
	if ( what )
	{
		if ( what !== "true" )
		{
			ad.info ( what ) ;
		}
		else
		{
			ad.info() ;
		}
		return ;
	}
	// what = T.getProperty ( "run" ) ;
	// if ( what && what === "true" )
	// {
	// 	console.log ( "Missing application name for -Drun=" ) ;
	// 	return ;
	// }
	// ad.getNumberOfInstances ( what ) ;
	return ;
}
