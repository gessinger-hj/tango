var net = require('net');
var os = require('os');
var EventEmitter = require ( "events" ).EventEmitter ;
var util = require ( "util" ) ;

var T = require ( "../Tango" ) ;
var Event = require ( "./Event" ) ;
var MultiHash = require ( "../MultiHash" ) ;
var Log = require ( "../LogFile" ) ;
var User = require ( "../User" ) ;

var counter = 0 ;
/**
 * @constructor
 * @extends EventEmitter
 * @param {} port
 * @param {} host
 * @return 
 */
var Client = function ( port, host )
{
  EventEmitter.call ( this ) ;
  this.port = port ;
  if ( ! this.port ) this.port = T.getProperty ( "gepard.port", "17501" ) ;
  this.host = host ;
  if ( ! this.host ) this.host = T.getProperty ( "gepard.host" ) ;
  this.socket = null ;
  this.user = null ;
  this.pendingEventList = [] ;
  this.pendingResultList = {} ;
  this.callbacks = {} ;
  this.pendingEventListenerList = [] ;
  this.eventListenerFunctions = new MultiHash() ;
  this.listenerFunctionsList = [] ;
  this.pendingLockList = [] ;
  this.lockedResources = {} ;
  this.alive = false ;
} ;
util.inherits ( Client, EventEmitter ) ;
/**
 * Description
 * @method setUser
 * @param {} user
 * @return 
 */
Client.prototype.setUser = function ( user )
{
  this.user = user ;
} ;
/**
 * Description
 * @method connect
 * @return 
 */
Client.prototype.connect = function()
{
  var p = {} ;
  if ( this.port  ) p.port = this.port ;
  if ( this.host  ) p.host = this.host ;
  var thiz = this ;
  this.socket = net.connect ( p, function()
  {
    thiz.alive = true ;
    var einfo = new Event ( "system", "client_info" ) ;
    einfo.data.hostname = os.hostname() ;
    einfo.data.connectionTime = new Date() ;
    einfo.data.application = process.argv[1] ;
    this.write ( einfo.serialize() ) ;

    var i ;
    if ( thiz.pendingEventList.length )
    {
      for ( i = 0 ; i < thiz.pendingEventList.length ; i++ )
      {
        counter++ ;
        var uid = os.hostname() + "_" + thiz.socket.localPort + "_" + counter ;
        var ctx = thiz.pendingEventList[i] ;
        var e = ctx.e ;
        var resultCallback = ctx.resultCallback ;
        e.setUniqueId ( uid ) ;
        thiz.callbacks[uid] = ctx ;
        ctx.e = undefined ;
        this.write ( e.serialize(), function()
        {
          if ( ctx.write ) ctx.write.apply ( thiz, arguments ) ;
        }) ;
      }
      thiz.pendingEventList.length = 0 ;
    }
    if ( thiz.pendingEventListenerList.length )
    {
      for ( i = 0 ; i < thiz.pendingEventListenerList.length ; i++ )
      {
        counter++ ;
        var uid = os.hostname() + "_" + this.localPort + "-" + counter ;
        var ctx = thiz.pendingEventListenerList[i] ;
        ctx.e.setUniqueId ( uid ) ;
        this.write ( ctx.e.serialize() ) ;
      }
      thiz.pendingEventListenerList.length = 0 ;
    }
    if ( thiz.pendingLockList.length )
    {
      for ( i = 0 ; i < thiz.pendingLockList.length ; i++ )
      {
        counter++ ;
        var uid = os.hostname() + "_" + this.localPort + "-" + counter ;
        var ctx = thiz.pendingLockList[i] ;
        ctx.e.setUniqueId ( uid ) ;
        this.write ( ctx.e.serialize() ) ;
        thiz.lockedResources[e.data.resourceId] = ctx;
      }
      thiz.pendingLockList.length = 0 ;
    }
  } ) ;
  this.socket.on ( 'data', function socket_on_data ( data )
  {
    var found ;
    var mm = data.toString() ;
    if ( ! this.partialMessage ) this.partialMessage = "" ;
    mm = this.partialMessage + mm ;
    this.partialMessage = "" ;
    var result = T.splitJSONObjects ( mm ) ;
    var messageList = result.list ;
    var i, j, k ;
    for ( j = 0 ; j < messageList.length ; j++ )
    {
      var m = messageList[j] ;
      if ( m.length === 0 )
      {
        continue ;
      }
      if ( j === messageList.length - 1 )
      {
        if ( result.lastLineIsPartial )
        {
          this.partialMessage = m ;
          break ;
        }
      }

      if ( m.charAt ( 0 ) === '{' )
      {
        var e = Event.prototype.deserialize ( m ) ;
        if ( e.isResult() )
        {
          var uid = e.getUniqueId() ;
          var ctx = thiz.callbacks[uid] ;
          if ( ! e.isBroadcast() )
          {
            delete thiz.callbacks[uid] ;
          }
          var rcb = ctx.result ;
          rcb.call ( thiz, e ) ;
          continue ;
        }
        if ( e.getName() === "system" )
        {
          if ( e.getType() === "shutdown" )
          {
            thiz.end() ;
            thiz.emit ( "shutdown" ) ;
            return ;
          }
          if ( e.isBad() )
          {
            var uid = e.getUniqueId() ;
            var ctx = thiz.callbacks[uid] ;
            delete thiz.callbacks[uid] ;
            var rcb = ctx.error ;
            if ( rcb )
            {
              rcb.call ( thiz, e ) ;
            }
            continue ;
          }
          if ( e.getType() === "lockResourceResult" )
          {
            var ctx = thiz.lockedResources[e.data.resourceId] ;
            if ( ! e.data.isLockOwner )
            {
              delete thiz.lockedResources[e.data.resourceId] ;
            }
            ctx.callback.call ( thiz, null, e ) ;
            continue ;
          }
          if ( e.getType() === "freeResourceResult" )
          {
            delete thiz.lockedResources[e.data.resourceId] ;
            continue ;
          }
        }
        else
        {
          if ( e.isBad() )
          {
            var uid = e.getUniqueId() ;
            var ctx = thiz.callbacks[uid] ;
            if ( ! ctx )
            {
              Log.warning ( e ) ;
              continue ;
            }
            delete thiz.callbacks[uid] ;
            var rcb = ctx.error ;
            if ( rcb )
            {
              rcb.call ( thiz, e ) ;
            }
            continue ;
          }
          found = false ;
          var callbackList = thiz.eventListenerFunctions.get ( e.getName() ) ;
          if ( callbackList )
          {
            found = true ;
            for  ( k = 0 ; k < callbackList.length ; k++ )
            {
              callbackList[k].call ( thiz, e ) ;
            }
          }
          for ( k = 0 ; k < thiz.listenerFunctionsList.length ; k++ )
          {
            list = thiz.listenerFunctionsList[k]._regexpList ;
            if ( ! list ) continue ;
            for ( j = 0 ; j < list.length ; j++ )
            {
              if ( ! list[j].test ( e.getName() ) ) continue ;
              found = true ;
              thiz.listenerFunctionsList[k].call ( thiz, e ) ;
            }
          }
          if ( ! found )
          {
            Log.logln ( "callbackList for " + e.getName() + " not found." ) ;
            Log.log ( e.toString() ) ;
            continue ;
          }
        }
      }
    }
  } ) ;
  this.socket.on ( 'end', function socket_on_end()
  {
    thiz.alive = false ;
    thiz.emit ( "end" ) ;
  });
  this.socket.on ( 'error', function socket_on_error ( e )
  {
    thiz.alive = false ;
    thiz.emit ( "error", e ) ;
  });
} ;
Client.prototype._writeCallback = function()
{
} ;
/**
 * Description
 * @method getSocket
 * @return MemberExpression
 */
Client.prototype.getSocket = function()
{
  if ( ! this.socket )
  {
    this.connect() ;
  }
  return this.socket ;
};
/**
 * Description
 * @method fire
 * @param {} params
 * @param {} callback
 * @return 
 */
Client.prototype.fire = function ( params, callback )
{
  this._fireEvent ( params, callback, null ) ;
};
/**
 * Description
 * @method request
 * @param {} params
 * @param {} callback
 * @return 
 */
Client.prototype.request = function ( params, callback )
{
  if ( typeof callback === 'function' )
  {
    callback = { result: callback } ;
  }
  if ( typeof callback.result !== 'function' )
  {
    throw new Error ( "Missing result function.")
  }
  this._fireEvent ( params, callback, { isBroadcast:false } ) ;
};
/**
 * Description
 * @method broadcast
 * @param {} params
 * @param {} callback
 * @return 
 */
Client.prototype.broadcast = function ( params, callback )
{
  this._fireEvent ( params, callback, { isBroadcast:true } ) ;
};
/**
 * Description
 * @method fireEvent
 * @param {} params
 * @param {} callback
 * @return 
 */
Client.prototype.fireEvent = function ( params, callback )
{
  return this._fireEvent ( params, callback, null ) ;
};
Client.prototype._fireEvent = function ( params, callback, opts )
{
  var e = null ;
  if ( params instanceof Event )
  {
    e = params ;
  }
  else
  if ( typeof params === 'string' )
  {
    e = new Event ( params ) ;
  }
  else
  if ( params && typeof params === 'object' )
  {
    e = new Event ( params.name, params.type ) ;
    e.setData ( params.data ) ;
    if ( params.user ) u = params.user ;
  }
  if ( this.user )
  {
    e.setUser ( this.user ) ;
  }
  var ctx = {} ;
  if ( callback )
  {
    if ( typeof callback === 'object' )
    {
      ctx.result = callback.result ;
      if ( ctx.result ) e.setResultRequested() ;
      ctx.error = callback.error ;
      ctx.write = callback.write ;
      if ( opts && opts.isBroadcast )
      {
        e.setIsBroadcast() ;
      }
    }
    else
    if ( typeof callback === 'function' )
    {
      if ( opts && opts.isBroadcast )
      {
        ctx.result = callback ;
        e.setIsBroadcast() ;
      }
      else
      {
        ctx.write = callback ;
      }
    }
  }
  var s = this.getSocket() ;
  if ( this.pendingEventList.length )
  {
    ctx.e = e ;
    this.pendingEventList.push ( ctx ) ;
  }
  if ( ! this.pendingEventList.length )
  {
    counter++ ;
    var uid = os.hostname() + "_" + this.socket.localPort + "-" + counter ;
    e.setUniqueId ( uid ) ;

    this.callbacks[uid] = ctx ;

    var thiz = this ;
    s.write ( e.serialize(), function()
    {
      if ( ctx.write ) ctx.write.apply ( thiz, arguments ) ;
    } ) ;
  }
};
/**
 * Description
 * @method sendResult
 * @param {} message
 * @return 
 */
Client.prototype.sendResult = function ( message )
{
  if ( ! message.isResultRequested() )
  {
    Log.error ( "No result requested" ) ;
    Log.error ( message ) ;
    return ;
  }
  message.setIsResult() ;
  this.socket.write ( message.serialize() ) ;
};
/**
 * Description
 * @method end
 * @return 
 */
Client.prototype.end = function()
{
  this.alive = false ;
  if ( this.socket ) this.socket.end() ;
  this.socket = null ;
  this.pendingEventList = [] ;
  this.user = null ;
  this.pendingResultList = {} ;
  this.pendingEventListenerList = [] ;
  this.eventListenerFunctions.flush() ;
  this.listenerFunctionsList = [] ;
};
/**
 * Description
 * @method addEventListener
 * @param {} eventNameList
 * @param {} callback
 * @return 
 */
Client.prototype.addEventListener = function ( eventNameList, callback )
{
  if ( ! eventNameList ) throw new Error ( "Client.addEventListener: Missing eventNameList." ) ;
  if ( typeof callback !== 'function' ) throw new Error ( "Client.addEventListener: callback must be a function." ) ;
  if ( typeof eventNameList === 'string' ) eventNameList = [ eventNameList ] ;
  if ( ! Array.isArray ( eventNameList ) )
  {
    throw new Error ( "Client.addEventListener: eventNameList must be a string or an array of strings." ) ;
  }
  if ( ! eventNameList.length )
  {
    throw new Error ( "Client.addEventListener: eventNameList must not be empty." ) ;
  }
  var e = new Event ( "system", "addEventListener" ) ;
  if ( this.user )
  {
    e.setUser ( this.user ) ;
  }
  e.data.eventNameList = eventNameList ;
  var i ;
  for ( i = 0 ; i < eventNameList.length ; i++ )
  {
    this.eventListenerFunctions.put ( eventNameList[i], callback ) ;
  }
  for ( i = 0 ; i < eventNameList.length ; i++ )
  {
    var pattern = eventNameList[i] ;
    if ( pattern.indexOf ( "*" ) >= 0 )
    {
      if ( ! callback._regexpList )
      {
        callback._regexpList = [] ;
      }
      pattern = pattern.replace ( /\./, "\\." ).replace ( /\*/, ".*" ) ;
      var regexp = new RegExp ( pattern ) ;
      callback._regexpList.push ( regexp ) ;
      this.listenerFunctionsList.push ( callback ) ;
    }
  }

  if ( ! this.socket )
  {
    this.pendingEventListenerList.push ( { e:e, callback:callback } ) ;
  }
  else
  if ( this.pendingEventListenerList.length )
  {
    this.pendingEventListenerList.push ( { e:e, callback:callback } ) ;
  }
  var s = this.getSocket() ;
  if ( ! this.pendingEventListenerList.length )
  {
    counter++ ;
    var uid = os.hostname() + "_" + this.localPort + "-" + counter ;
    e.setUniqueId ( uid ) ;
    var thiz = this ;
    s.write ( e.serialize() ) ;
  }
};
/**
 * Description
 * @method on
 * @param {} eventName
 * @param {} callback
 * @return 
 */
Client.prototype.on = function ( eventName, callback )
{
  if ( typeof eventName === "string"
     && (  eventName === "shutdown"
        || eventName === "end"
        || eventName === "error"
        )
     )
  {
    EventEmitter.prototype.on.apply ( this, arguments ) ;
    return ;
  }
  this.addEventListener ( eventName, callback ) ;
};
/**
 * Description
 * @method removeEventListener
 * @param {} eventNameOrFunction
 * @return 
 */
Client.prototype.removeEventListener = function ( eventNameOrFunction )
{
  if ( ! this.alive )
  {
    return ;
  }
  var i, j ;
  if ( typeof eventNameOrFunction === 'string' )
  {
    eventNameOrFunction = [ eventNameOrFunction ] ;
  }
  else
  if ( typeof eventNameOrFunction === 'function' )
  {
    eventNameOrFunction = [ eventNameOrFunction ] ;
  }
  else
  if ( Array.isArray ( eventNameOrFunction ) )
  {
  }
  else
  {
    throw new Error ( "Client.removeEventListener: eventNameOrFunction must be a function, a string or an array of strings." ) ;
  }

  var eventNameList = [] ;
  for ( i = 0 ; i < eventNameOrFunction.length  ; i++ )
  {
    var item = eventNameOrFunction[i] ;
    if ( typeof item === 'string' )
    {
      eventNameList.push ( item ) ;
      var list = this.eventListenerFunctions.get ( item ) ;
      if ( list )
      {
        for ( j = 0 ; j < list.length ; j++ )
        {
          this.listenerFunctionsList.remove ( list[j] ) ;
        }
      }
      this.eventListenerFunctions.remove ( item ) ;
    }
    else
    if ( typeof item === 'function' )
    {
      var keys = this.eventListenerFunctions.getKeysOf ( item ) ;
      for ( i = 0 ; i < keys.length ; i++ )
      {
        eventNameList.push ( keys[i] ) ;
      }
      this.eventListenerFunctions.remove ( item ) ;
      this.listenerFunctionsList.remove ( item ) ;
    }
    if ( ! eventNameList.length ) return ;
    var e = new Event ( "system", "removeEventListener" ) ;
    e.setUser ( this.user ) ;
    e.data.eventNameList = eventNameList ;
    var s = this.getSocket() ;
    s.write ( e.serialize() ) ;
  }
};
/**
 * Description
 * @method lockResource
 * @param {} resourceId
 * @param {} callback
 * @return 
 */
Client.prototype.lockResource = function ( resourceId, callback )
{
  if ( typeof resourceId !== 'string' || ! resourceId ) throw new Error ( "Client.lockResource: resourceId must be a string." ) ;
  if ( typeof callback !== 'function' ) throw new Error ( "Client.lockResource: callback must be a function." ) ;

  var e = new Event ( "system", "lockResourceRequest" ) ;
  e.data.resourceId = resourceId ;
  var s = this.getSocket() ;
  var ctx = {} ;
  ctx.resourceId = resourceId ;
  ctx.callback = callback ;
  ctx.e = e ;

  if ( this.pendingLockList.length )
  {
    this.pendingLockList.push ( ctx ) ;
  }
  if ( ! this.pendingLockList.length )
  {
    counter++ ;
    var uid = os.hostname() + "_" + this.socket.localPort + "-" + counter ;
    e.setUniqueId ( uid ) ;
    this.lockedResources[resourceId] = ctx;
    s.write ( e.serialize() ) ;
  }
};
/**
 * Description
 * @method freeResource
 * @param {} resourceId
 * @return 
 */
Client.prototype.freeResource = function ( resourceId )
{
  if ( typeof resourceId !== 'string' || ! resourceId ) throw new Error ( "Client.lockResource: resourceId must be a string." ) ;
  if ( ! this.lockedResources[resourceId] ) throw new Error ( "Client.freeResource: not owner of resourceId=" + resourceId ) ;

  var e = new Event ( "system", "freeResourceRequest" ) ;
  e.data.resourceId = resourceId ;
  var s = this.getSocket() ;
  counter++ ;
  var uid = os.hostname() + "_" + this.socket.localPort + "-" + counter ;
  e.setUniqueId ( uid ) ;
  delete this.lockedResources[resourceId] ;
  s.write ( e.serialize() ) ;
};
module.exports = Client ;
