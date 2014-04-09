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
var Client = function ( port, host )
{
  this.port = port ;
  if ( ! this.port ) this.port = T.getProperty ( "gepard.port" ) ;
  this.host = host ;
  if ( ! this.host ) this.host = T.getProperty ( "gepard.host" ) ;
  this.socket = null ;
  this.pendingEventList = [] ;
  this.user = null ;
  this.pendingResultList = {} ;
  this.callbacks = {} ;
  T.mixin ( Events.EventMulticasterTrait, this ) ;
  this.pendingEventListenerList = [] ;
  this.eventListenerFunctions = new MultiHash() ;
} ;
/** */
Client.prototype.setUser = function ( user )
{
  this.user = user ;
} ;
/** */
Client.prototype.connect = function()
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
  this.socket.on ( 'data', function(data)
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
          var callbackList = thiz.eventListenerFunctions.get ( e.getName() ) ;
          if ( ! callbackList )
          {
            LF.logln ( "callbackList for " + e.getName() + " not found." ) ;
            LF.log ( e ) ;
          }
          for  ( j = 0 ; j < callbackList.length ; j++ )
          {
            callbackList[j].call ( thiz, e ) ;
            if ( e.isResult() && e.isResultRequested() )
            {
              this.write ( e.serialize() ) ;
            }
          }
        }
      }
    }
  } ) ;
  this.socket.on ( 'end', function ()
  {
    thiz._fireEvent ( "end" ) ;
  });
} ;
Client.prototype._writeCallback = function()
{
} ;
/** */
Client.prototype.getSocket = function()
{
  if ( ! this.socket )
  {
    this.connect() ;
  }
  return this.socket ;
};
/** */
Client.prototype.fire = function ( params, callback )
{
  this.fireEvent ( params, callback ) ;
};
Client.prototype.fireEvent = function ( params, callback )
{
  var e = null ;
  var u = this.user ;
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
  if ( u )
  {
    e.setUser ( u ) ;
  }
  var resultCallback ;
  var errorCallback ;
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
Client.prototype.end = function()
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
Client.prototype.on = function ( name, callback )
{
  this.addListener ( this, callback, name ) ;
};
/** */
Client.prototype.addEventListener = function ( eventNameList, callback )
{
  if ( ! eventNameList ) throw new Error ( "Client.addEventListener: Missing eventNameList." ) ;
  if ( typeof callback !== 'function' ) throw new Error ( "Client.addEventListener: callback must be a function." ) ;
  if ( typeof eventNameList === 'string' ) eventNameList = [ eventNameList ] ;
  if ( ! T.isArray ( eventNameList ) )
  {
    throw new Error ( "Client.addEventListener: Missing eventNameList must be an array." ) ;
  }
  var u = this.user ;
  var e = new NEvent ( "system", "addEventListener" ) ;
  if ( u )
  {
    e.setUser ( this.user ) ;
  }
  var e = new NEvent ( "system", "addEventListener" ) ;
  e.data.eventList = eventNameList ;
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
Client.prototype.removeEventListener = function ( eventNameOrFunction )
{
  var i ;
  if ( typeof eventNameOrFunction === 'string' )
  {
    eventNameOrFunction = [ eventNameOrFunction ] ;
  }
  if ( Array.isArray ( eventNameOrFunction ) )
  {
    for ( i = 0 ; i < eventNameOrFunction.length  ; i++ )
    {
      var list = this.eventListenerFunctions.get ( eventNameOrFunction ) ;
      if ( ! list ) continue ;
      this.eventListenerFunctions.remove  ( eventNameOrFunction ) ;
    }
    var e = new NEvent ( "system", "removeEventListener" ) ;
    var u = this.user ;
    if ( u )
    {
      e.setUser ( this.user ) ;
    }
    e.data.eventList = eventNameOrFunction ;
    var s = this.getSocket() ;
    s.write ( e.serialize() ) ;
  }
};
if ( typeof tangojs === 'object' && tangojs ) tangojs.Client = Client ;
else tangojs = { Client:Client } ;

module.exports = Client ;
