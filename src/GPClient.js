var net = require('net');
var os = require('os');
var T = require ( "./Tango" ) ;
var GPEvent = require ( "./GPEvent" ) ;
var MultiHash = require ( "./MultiHash" ) ;
var Log = require ( "./LogFile" ) ;
var User = require ( "./User" ) ;
var EventEmitter = require ( "events" ).EventEmitter ;
var util = require ( "util" ) ;

var counter = 0 ;
/**
 * @constructor
 * @extends EventEmitter
 * @param {} port
 * @param {} host
 */
var GPClient = function ( port, host )
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
} ;
util.inherits ( GPClient, EventEmitter ) ;
/**
 * Description
 * @param {} user
 */
GPClient.prototype.setUser = function ( user )
{
  this.user = user ;
} ;
/**
 * Description
 */
GPClient.prototype.connect = function()
{
  var p = {} ;
  if ( this.port  ) p.port = this.port ;
  if ( this.host  ) p.host = this.host ;
  var thiz = this ;
  this.socket = net.connect ( p, function()
  {
    var einfo = new GPEvent ( "system", "client_info" ) ;
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
    var messageList = T.splitJSONObjects ( mm ) ;
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
        if ( m.charAt ( m.length - 1 ) !== '}' )
        {
          this.partialMessage = m ;
          break ;
        }
      }

      if ( m.charAt ( 0 ) === '{' )
      {
        var e = GPEvent.prototype.deserialize ( m ) ;
        if ( e.isResult() )
        {
          var uid = e.getUniqueId() ;
          var ctx = thiz.callbacks[uid] ;
          delete thiz.callbacks[uid] ;
          var rcb = ctx.result ;
          rcb.call ( thiz, e ) ;
          continue ;
        }
        if ( e.getName() === "system" )
        {
          if ( e.getType() === "shutdown" )
          {
            this.end() ;
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
    thiz.emit ( "end" ) ;
  });
  this.socket.on ( 'error', function socket_on_error ( e )
  {
    thiz.emit ( "error", e ) ;
  });
} ;
GPClient.prototype._writeCallback = function()
{
} ;
/**
 * Description
 * @return MemberExpression
 */
GPClient.prototype.getSocket = function()
{
  if ( ! this.socket )
  {
    this.connect() ;
  }
  return this.socket ;
};
/**
 * Description
 * @param {} params
 * @param {} callback
 */
GPClient.prototype.fire = function ( params, callback )
{
  this.fireEvent ( params, callback ) ;
};
/**
 * Description
 * @param {} params
 * @param {} callback
 */
GPClient.prototype.fireEvent = function ( params, callback )
{
  var e = null ;
  if ( params instanceof GPEvent )
  {
    e = params ;
  }
  else
  if ( typeof params === 'string' )
  {
    e = new GPEvent ( params ) ;
  }
  else
  if ( params && typeof params === 'object' )
  {
    e = new GPEvent ( params.name, params.type ) ;
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
    }
    else
    if ( typeof callback === 'function' )
    {
      ctx.write = callback ;
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
 * @param {} message
 */
GPClient.prototype.sendResult = function ( message )
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
 */
GPClient.prototype.end = function()
{
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
 * @param {} eventNameList
 * @param {} callback
 */
GPClient.prototype.addEventListener = function ( eventNameList, callback )
{
  if ( ! eventNameList ) throw new Error ( "GPClient.addEventListener: Missing eventNameList." ) ;
  if ( typeof callback !== 'function' ) throw new Error ( "GPClient.addEventListener: callback must be a function." ) ;
  if ( typeof eventNameList === 'string' ) eventNameList = [ eventNameList ] ;
  if ( ! Array.isArray ( eventNameList ) )
  {
    throw new Error ( "GPClient.addEventListener: eventNameList must be a string or an array of strings." ) ;
  }
  if ( ! eventNameList.length )
  {
    throw new Error ( "GPClient.addEventListener: eventNameList must not be empty." ) ;
  }
  var e = new GPEvent ( "system", "addEventListener" ) ;
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
GPClient.prototype.on = function ( eventName, callback )
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
 * @param {} eventNameOrFunction
 */
GPClient.prototype.removeEventListener = function ( eventNameOrFunction )
{
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
    throw new Error ( "GPClient.removeEventListener: eventNameOrFunction must be a function, a string or an array of strings." ) ;
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
    var e = new GPEvent ( "system", "removeEventListener" ) ;
    e.setUser ( this.user ) ;
    e.data.eventNameList = eventNameList ;
    var s = this.getSocket() ;
    s.write ( e.serialize() ) ;
  }
};
/**
 * Description
 * @param {} eventNameOrFunction
 */
GPClient.prototype.lockResource = function ( resourceId, callback )
{
  if ( typeof resourceId !== 'string' || ! resourceId ) throw new Error ( "GPClient.lockResource: resourceId must be a string." ) ;
  if ( typeof callback !== 'function' ) throw new Error ( "GPClient.lockResource: callback must be a function." ) ;

  var e = new GPEvent ( "system", "lockResourceRequest" ) ;
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
 * @param {} eventNameOrFunction
 */
GPClient.prototype.freeResource = function ( resourceId )
{
  if ( typeof resourceId !== 'string' || ! resourceId ) throw new Error ( "GPClient.lockResource: resourceId must be a string." ) ;
  if ( ! this.lockedResources[resourceId] ) throw new Error ( "GPClient.freeResource: not owner of resourceId=" + resourceId ) ;

  var e = new GPEvent ( "system", "freeResourceRequest" ) ;
  e.data.resourceId = resourceId ;
  var s = this.getSocket() ;
  counter++ ;
  var uid = os.hostname() + "_" + this.socket.localPort + "-" + counter ;
  e.setUniqueId ( uid ) ;
  delete this.lockedResources[resourceId] ;
  s.write ( e.serialize() ) ;
};
module.exports = GPClient ;
