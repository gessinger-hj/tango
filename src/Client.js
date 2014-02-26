var net = require('net');
var os = require('os');
var NEvent = require ( "Event" ).NEvent ;
var T = require ( "Tango" ) ;
var events = require ( "TEvents" ) ;
var MultiHash = require ( "Utils" ).MultiHash ;
var Logger = require ( "TLogFile" ) ;
var User = require ( "User" ) ;

var counter = 0 ;
/**
  * @constructor
  */
Client = function ( port, host )
{
  this.port = port ;
  if ( ! this.port ) this.port = T.getProperty ( "GEPARD_PORT" ) ;
  this.host = host ;
  if ( ! this.host ) this.host = T.getProperty ( "GEPARD_HOST" ) ;
  this.socket = null ;
  this.pendingEventList = [] ;
  this.user = null ;
  this.pendingResultList = {} ;
  this.resultCallbacks = {} ;
  T.mixin ( events.EventMulticasterTrait, this ) ;
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
    var i ;
    if ( thiz.pendingEventList.length )
    {
      for ( i = 0 ; i < thiz.pendingEventList.length ; i++ )
      {
        counter++ ;
        var uid = os.hostname() + "_" + this.localPort + "-" + counter ;
        var ctx = thiz.pendingEventList[i] ;
        var e = ctx.e ;
        var callback = ctx.callback ;
        var resultCallback = ctx.resultCallback ;
        e.setUniqueId ( uid ) ;
        if ( resultCallback )
        {
          thiz.resultCallbacks[uid] = resultCallback ;
        }
        this.write ( T.serialize ( e ), function()
        {
          if ( callback ) callback.apply ( thiz, arguments ) ;
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
        this.write ( T.serialize ( e ) ) ;
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
          var rcb = thiz.resultCallbacks[uid] ;
          delete thiz.resultCallbacks[uid] ;
          rcb.call ( thiz, e ) ;
          continue ;
        }
        if ( e.getName() === "system" )
        {
          if ( e.isBad() )
          {
T.log ( e ) ;
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
              this.write ( T.serialize ( e ) ) ;
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
  if ( callback && typeof callback === 'object' )
  {
    var resultCallback = callback.result ;
    if ( resultCallback )
    {
      e.setRequestResult() ;
    }
    callback = callback.callback ;
  }
  if ( ! this.socket )
  {
    this.pendingEventList.push ( { e:e, callback:callback, resultCallback:resultCallback } ) ;
  }
  var s = this.getSocket() ;
  if ( ! this.pendingEventList.length )
  {
    if ( resultCallback )
    {
      this.resultCallbacks[uid] = resultCallback ;
    }

    counter++ ;
    var uid = os.hostname() + "_" + this.localPort + "-" + counter ;
    e.setUniqueId ( uid ) ;
    var thiz = this ;
    s.write ( T.serialize ( e ), function()
    {
      if ( callback ) callback.apply ( thiz, arguments ) ;
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
  var s = this.getSocket() ;
  if ( ! this.pendingEventListenerList.length )
  {
    counter++ ;
    var uid = os.hostname() + "_" + this.localPort + "-" + counter ;
    e.setUniqueId ( uid ) ;
    var thiz = this ;
    s.write ( T.serialize ( e ) ) ;
  }
};
module.exports = Client ;