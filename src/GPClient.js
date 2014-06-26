var net = require('net');
var os = require('os');
var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var Events = require ( "Events" ) ;
var MultiHash = require ( "MultiHash" ) ;
var Log = require ( "LogFile" ) ;
var User = require ( "User" ) ;

var counter = 0 ;
/**
  * @constructor
  */
var GPClient = function ( port, host )
{
  this.port = port ;
  if ( ! this.port ) this.port = T.getProperty ( "gepard.port", "17501" ) ;
  this.host = host ;
  if ( ! this.host ) this.host = T.getProperty ( "gepard.host" ) ;
  this.socket = null ;
  this.user = null ;
  this.pendingEventList = [] ;
  this.pendingResultList = {} ;
  this.callbacks = {} ;
  T.mixin ( Events.EventMulticasterTrait, this ) ;
  this.pendingEventListenerList = [] ;
  this.eventListenerFunctions = new MultiHash() ;
} ;
/** */
GPClient.prototype.setUser = function ( user )
{
  this.user = user ;
} ;
/** */
GPClient.prototype.connect = function()
{
  var p = {} ;
  if ( this.port  ) p.port = this.port ;
  if ( this.host  ) p.host = this.host ;
  var thiz = this ;
  this.socket = net.connect ( p, function()
  {
    var einfo = new NEvent ( "system", "client_info" ) ;
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
        var e = ctx.e ;
        var callback = ctx.callback ;
        e.setUniqueId ( uid ) ;
        this.write ( e.serialize() ) ;
      }
      thiz.pendingEventListenerList.length = 0 ;
    }
  } ) ;
  this.socket.on ( 'data', function socket_on_data ( data )
  {
    var mm = data.toString() ;
    if ( ! this.partialMessage ) this.partialMessage = "" ;
    mm = this.partialMessage + mm ;
    this.partialMessage = "" ;
    var messageList = T.splitJSONObjects ( mm ) ;

    var j = 0 ;
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
        var e = T.deserialize ( m ) ;
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
        }
        else
        {
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
          var callbackList = thiz.eventListenerFunctions.get ( e.getName() ) ;
          if ( ! callbackList )
          {
            Log.logln ( "callbackList for " + e.getName() + " not found." ) ;
            Log.log ( e.toString() ) ;
          }
          for  ( j = 0 ; j < callbackList.length ; j++ )
          {
            callbackList[j].call ( thiz, e ) ;
          }
        }
      }
    }
  } ) ;
  this.socket.on ( 'end', function socket_on_end()
  {
    thiz._fireEvent ( "end" ) ;
  });
  this.socket.on ( 'error', function socket_on_error(p,q)
  {
  });
} ;
GPClient.prototype._writeCallback = function()
{
} ;
/** */
GPClient.prototype.getSocket = function()
{
  if ( ! this.socket )
  {
    this.connect() ;
  }
  return this.socket ;
};
/** */
GPClient.prototype.fire = function ( params, callback )
{
  this.fireEvent ( params, callback ) ;
};
GPClient.prototype.fireEvent = function ( params, callback )
{
  var e = null ;
  if ( params instanceof NEvent )
  {
    e = params ;
  }
  else
  {
    e = new NEvent ( params.name, params.type ) ;
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
      if ( ctx.result ) e.setRequestResult() ;
      ctx.error = callback.error ;
      ctx.write = callback.write ;
    }
    else
    if ( typeof callback === 'function' )
    {
      ctx.write = callback ;
    }
  }
  if ( ! this.socket )
  {
    ctx.e = e ;
    this.pendingEventList.push ( ctx ) ;
  }
  var s = this.getSocket() ;
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
/** */
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
GPClient.prototype.end = function()
{
  if ( this.socket ) this.socket.end() ;
  this.socket = null ;
  this.pendingEventList = [] ;
  this.user = null ;
  this.pendingResultList = {} ;
  this.pendingEventListenerList = [] ;
  this.eventListenerFunctions.flush() ;
};
/** */
GPClient.prototype.on = function ( name, callback )
{
  this.addListener ( this, callback, name ) ;
};
/** */
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
  var e = new NEvent ( "system", "addEventListener" ) ;
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
GPClient.prototype.removeEventListener = function ( eventNameOrFunction )
{
  var i ;
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
    }
    if ( ! eventNameList.length ) return ;
    var e = new NEvent ( "system", "removeEventListener" ) ;
    e.setUser ( this.user ) ;
    e.data.eventNameList = eventNameList ;
    var s = this.getSocket() ;
    s.write ( e.serialize() ) ;
  }
};
if ( typeof tangojs === 'object' && tangojs ) tangojs.GPClient = GPClient ;
else tangojs = { GPClient:GPClient } ;

module.exports = GPClient ;
