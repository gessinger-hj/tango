var NEvent = require ( "NEvent" ) ;
var Log = require ( "LogFile" ) ;
var Client = require ( "Client" ) ;

var MultiHash = require ( "MultiHash" ) ;
var T = require ( "Tango" ) ;
var ws = require ( "nodejs-websocket" ) ;

var WebSocketEventProxy = function ( port )
{
	this.className = "WebSocketEventProxy" ;
  this._sockets = {} ;
  this._eventNameToSocketContext = new MultiHash() ;
	this.client = null ;
	this.port = port ;
	this._create() ;
}
WebSocketEventProxy.prototype.toString = function()
{
	return "(" + this.className + ")[port=" + this.port + "]" ;
};
WebSocketEventProxy.prototype.sendToWebSocket = function ( e )
{
	var pid = e.getProxyIdentifier() ;
	var ctx = this._sockets[pid]
	if ( ctx )
	{
		ctx.socket.sendText ( e.serialize() ) ;
	}
};
WebSocketEventProxy.prototype.generalEventListenerFunction = function ( e )
{
	var se = e.serialize() ;
	var i, ctx ;
	var name = e.getName() ;
	var list = this._eventNameToSocketContext.get ( name ) ;
	if ( list )
	{
		for ( i = 0 ; i < list.length ; i++ )
		{
			ctx = list[i] ;
			ctx.socket.sendText ( se ) ;
		}
	}
};
WebSocketEventProxy.prototype.removeWebsocket = function ( socket )
{
	var ctx = this._sockets[socket.key] ;
	var eventNamesToBeRemoved = [] ;
	if ( ctx )
	{
		var currentKeys = this._eventNameToSocketContext.getKeys() ;
		this._eventNameToSocketContext.remove ( ctx ) ;
		for ( i = 0 ; i < currentKeys.length ; i++ )
		{
			if ( ! this._eventNameToSocketContext.get ( currentKeys[i] ) )
			{
				eventNamesToBeRemoved.push ( currentKeys[i] ) ;
			}
		}
		delete this._sockets[ctx.sid] ;
	}
	if ( eventNamesToBeRemoved.length && this.client )
	{
		this.client.removeEventListener ( eventNamesToBeRemoved ) ;
	}
};

WebSocketEventProxy.prototype._create = function()
{
	var wssOptions = {} ;
	var thiz = this ;
	this.server = ws.createServer ( wssOptions, function ( conn )
	{
		var eventNameList ;
		var i = 0 ;
		var index = 0 ;
		conn.on ( "text", function ( message )
		{
			var ne = NEvent.prototype.deserialize ( message ) ;
			ne.setProxyIdentifier ( conn.key ) ;
			var ctx = thiz._sockets[this.key] ;
			if ( ! ctx )
			{
				ctx = { socket:conn, sid: conn.key } ;
				thiz._sockets[ctx.sid] = ctx ;
			}
			if ( ! thiz.client )
			{
				thiz.client = new Client() ;
				thiz.client.on ( 'end', function()
				{
				  thiz.client = null ;
				});
			}
			if ( ne.getName() === 'system' )
			{
				thiz.handleSystemMessages ( ctx, ne ) ;
			}
			else
			{
				thiz.client.fire ( ne
	      , { result: function(e)
	          {
							if ( e.isResult() )
							{
								thiz.sendToWebSocket ( e ) ;
							}
	          }
	        	, error: function(e)
	          	{
								thiz.sendToWebSocket ( e ) ;
	          	}
	         	, write: function()
	          	{
	          	}
	        	}) ;
						thiz.client.on('end', function()
						{
							thiz.client = null ;
						  Log.warning ( 'gepard socket died unexpectedly' ) ;
						});
				}
		}) ;
		conn.on ( "error", function ( e )
		{
			Log.info ( "web-socket closed with error" ) ;
			thiz.removeWebsocket ( this ) ;
		}) ;
		conn.on ( "close", function ( message )
		{
			Log.info ( "web-socket closed" ) ;
			thiz.removeWebsocket ( this ) ;
		}) ;
	}) ;
};
WebSocketEventProxy.prototype.handleSystemMessages = function ( ctx, ne )
{
	if ( ne.getType() === 'addEventListener' )
	{
	  eventNameList = ne.data.eventNameList ;
	  var errText = "" ;
	  if ( ! eventNameList ) { Log.error ( "Missing eventNameList." ) ; return ; }
	  if ( typeof eventNameList === 'string' ) eventNameList = [ eventNameList ] ;
	  if ( ! Array.isArray ( eventNameList ) )
	  {
	    Log.error ( "eventNameList must be a string or an array of strings." ) ; return ;
	  }
	  if ( ! eventNameList.length )
	  {
	    Log.error ( "eventNameList must not be empty." ) ; return ;
	  }
	  if ( ! ctx.eventNameList ) ctx.eventNameList = [] ;
	  for ( i = 0 ; i < ctx.eventNameList.lenth ; i++ )
	  {
	  	index = eventNameList.indexOf ( ctx.eventNameList[i] ) ;
	  	if ( index >= 0 )
	  	{
        eventNameList.splice ( index, 1 ) ;
	  	}
	  }
	  if ( ! eventNameList.length )
	  {
	  	return ;
	  }
	  for ( i = 0 ; i < eventNameList.length ; i++ )
	  {
	  	ctx.eventNameList.push ( eventNameList[i] ) ;
	  }
	  var eventNameListToBePropagated = [] ;
	  for ( i = 0 ; i < eventNameList.length ; i++ )
	  {
	  	if ( ! this._eventNameToSocketContext.get ( eventNameList[i] ) )
	  	{
	  		eventNameListToBePropagated.push ( eventNameList[i] ) ;
	  	}
			this._eventNameToSocketContext.put ( eventNameList[i], ctx ) ;
	  }
	  if ( eventNameListToBePropagated.length )
	  {
	  	this.client.addEventListener ( eventNameListToBePropagated, this.generalEventListenerFunction.bind ( this ) ) ;
	  }
	}
	else
	if ( ne.getType() === 'removeEventListener' )
	{
	  eventNameList = ne.data.eventNameList ;
	  var errText = "" ;
	  if ( ! eventNameList ) { Log.error ( "Missing eventNameList." ) ; return ; }
	  if ( typeof eventNameList === 'string' ) eventNameList = [ eventNameList ] ;
	  if ( ! Array.isArray ( eventNameList ) )
	  {
	    Log.error ( "eventNameList must be a string or an array of strings." ) ; return ;
	  }
	  if ( ! eventNameList.length )
	  {
	    Log.error ( "eventNameList must not be empty." ) ; return ;
	  }
		var currentKeys = this._eventNameToSocketContext.getKeys() ;
		for ( i = 0 ; i < eventNameList.length ; i++ )
		{
	  	index = ctx.eventNameList.indexOf ( eventNameList[i] ) ;
	  	if ( index >= 0 )
	  	{
        ctx.eventNameList.splice ( index, 1 ) ;
				this._eventNameToSocketContext.remove ( eventNameList[i], ctx ) ;
	  	}
		}
	  var eventNamesToBeRemoved = [] ;
		for ( i = 0 ; i < currentKeys.length ; i++ )
		{
			if ( ! this._eventNameToSocketContext.get ( currentKeys[i] ) )
			{
				eventNamesToBeRemoved.push ( currentKeys[i] ) ;
			}
		}
		if ( eventNamesToBeRemoved.length )
		{
			this.client.removeEventListener ( eventNamesToBeRemoved ) ;
		}
	}
};
WebSocketEventProxy.prototype.listen = function ( port )
{
	if ( port )
	{
		this.port = port ;
	}
	if ( ! this.port )
	{
    this.port = T.getProperty ( "gepard.websocket.port", 17502 ) ;
	}
	this.server.listen ( port, this.listenSocketBound.bind ( this ) ) ;
};
WebSocketEventProxy.prototype.listenSocketBound = function()
{
	Log.notice ( "Server bound to port=" + this.port ) ;
};
module.exports = WebSocketEventProxy ;

if ( require.main === module )
{
	var ep = new WebSocketEventProxy() ;
	var WEBSOCKET_PORT = T.getProperty ( "gepard.websocket.port", 17502 ) ;
	ep.listen ( WEBSOCKET_PORT ) ;
}


