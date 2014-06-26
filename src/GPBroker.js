var net = require('net');
var EventEmitter = require ( "events" ).EventEmitter ;
var NEvent = require ( "NEvent" ) ;
var T = require ( "Tango" ) ;
var MultiHash = require ( "MultiHash" ) ;
var Log = require ( "LogFile" ) ;

/**
  * @constructor
  */
GPBroker = function ( port, ip )
{
  EventEmitter.call ( this ) ;
  this._sockets = {} ;
  this._eventNameToSockets = new MultiHash() ;
  this.port = port ;
  this.ip = ip ;
  this.closing = false ;
  var thiz = this ;
  var ctx ;
  this.server = net.createServer() ;
  this.server.on ( "error", function onerror ( p )
  {
    Log.error ( p ) ;
  });
  this.server.on ( "close", function onclose ( p )
  {
    Log.info ( p ) ;
  });
  this.server.on ( "connection", function server_on_connection ( socket )
  {
    if ( thiz.closing )
    {
      socket.end() ;
      return ;
    }
    var sid = socket.remoteAddress + "_" + socket.remotePort ;
    socket.sid = sid ;
    thiz._sockets[sid] = { sid:sid, socket:socket, info:"none" } ;

    Log.info ( 'Socket connected' );
    socket.on ( "error", function socket_on_error ( p )
    {
      thiz.ejectSocket ( this ) ;
    });
    socket.on ( "close", function socket_on_close ( p )
    {
      thiz.ejectSocket ( this ) ;
    });
    socket.on ( 'end', function socket_on_end()
    {
      thiz.ejectSocket ( this ) ;
    });
    socket.on ( "data", function socket_on_data ( chunk )
    {
      if ( thiz.closing )
      {
        return ;
      }
      var mm = chunk.toString() ;
      var i ;
      var eventNameList ;
      var eOut ;
      var str ;
      var key ;
      var sid ;
      var index ;

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
            sid = e.getSourceIdentifier() ;
            ctx = thiz._sockets[sid] ;
            if ( ctx )
            {
              ctx.socket.write ( e.serialize() ) ;
            }
            continue ;
          }
          if ( e.getName() === 'system' )
          {
            if ( e.getType() === "shutdown" )
            {
              e.control.status = { code:0, name:"ack" } ;
              this.write ( e.serialize() ) ;
              thiz.closeAllSockets ( this ) ;
              thiz.server.unref() ;
              return ;
            }
            else
            if ( e.getType() === "client_info" )
            {
              ctx = thiz._sockets[this.sid] ;
              ctx.client_info = e.data ; e.data = {} ;
              ctx.client_info.sid = this.sid ;
              continue ;
            }
            else
            if ( e.getType() === "getInfoRequest" )
            {
              e.setType ( "getInfoResult" ) ;
              e.control.status = { code:0, name:"ack" } ;
              e.data.currentEventNames = thiz._eventNameToSockets.getKeys() ;
              var mhclone = new MultiHash() ;
              for ( key in thiz._eventNameToSockets._hash )
              {
                var afrom = thiz._eventNameToSockets.get ( key ) ;
                if ( typeof ( afrom ) === 'function' ) continue ;
                for ( var ii = 0 ; ii < afrom.length ; ii++ )
                {
                  mhclone.put ( key, afrom[ii].sid ) ;
                }
              }
              e.data.mapping = mhclone._hash ;
              var kk ;
              e.data.connectionList = [] ;
              for ( kk in thiz._sockets )
              {
                var client_info = thiz._sockets[kk].client_info ;
                if ( ! client_info ) continue ;
                e.data.connectionList.push ( client_info ) ;
              }
              this.write ( e.serialize() ) ;
              continue ;
            }
            else
            if ( e.getType() === "addEventListener" )
            {
              eventNameList = e.data.eventNameList ;
              if ( ! eventNameList || ! eventNameList.length )
              {
                e.control.status = { code:1, name:"error", reason:"Missing eventNameList" } ;
                Log.error ( e.toString() ) ;
                this.write ( e.serialize() ) ;
                continue ;
              }
              ctx = thiz._sockets[this.sid] ;
              if ( ! ctx.eventNameList )
              {
                ctx.eventNameList = eventNameList ;
              }
              else
              {
                for  ( i = 0 ; i < eventNameList.length ; i++ )
                {
                  ctx.eventNameList.push ( eventNameList[i] ) ;
                }
              }
              for  ( i = 0 ; i < eventNameList.length ; i++ )
              {
                thiz._eventNameToSockets.put ( eventNameList[i], this ) ;
              }
              e.control.status = { code:0, name:"ack" } ;
              this.write ( e.serialize() ) ;
              continue ;
            }
            else
            if ( e.getType() === "removeEventListener" )
            {
              eventNameList = e.data.eventNameList ;
              ctx = thiz._sockets[this.sid] ;
              if ( ! eventNameList || ! eventNameList.length )
              {
                eventNameList = ctx.eventNameList ;
              }
              if ( ! eventNameList || ! eventNameList.length )
              {
                e.control.status = { code:1, name:"error", reason:"Missing eventNameList" } ;
                Log.error ( e.toString() ) ;
                continue ;
              }
              var toBeRemoved = [] ;
              for  ( i = 0 ; i < eventNameList.length ; i++ )
              {
                thiz._eventNameToSockets.remove ( eventNameList[i], this ) ;
                index  = ctx.eventNameList.indexOf ( eventNameList[i] ) ;
                if ( index >= 0 )
                {
                  toBeRemoved.push ( eventNameList[i] ) ;
                }
              }
              for  ( i = 0 ; i < toBeRemoved.length ; i++ )
              {
                index = ctx.eventNameList.indexOf ( toBeRemoved[i] ) ;
                ctx.eventNameList.splice ( index, 1 ) ;
              }
              toBeRemoved.length = 0 ;
              continue ;
            }
            else
            {
              Log.error ( "Invalid type: '" + e.getType() + "' for " + e.getName() ) ;
              Log.error ( e.toString() ) ;
              continue ;
            }
          }
          var socketList = thiz._eventNameToSockets.get ( e.getName() ) ;
          if ( ! socketList )
          {
            if ( e.isResultRequested() )
            {
              e.control.status = { code:1, name:"warning", reason:"No listener found for event: " + e.getName() } ;
              e.control.requestedName = e.getName() ;
              this.write ( e.serialize() ) ;
            }
            Log.error ( "No listener found for " + e.getName() ) ;
            Log.error ( e.toString() ) ;
            continue ;
          }
          e.setSourceIdentifier ( this.sid ) ;
          var str = e.serialize() ;
          for ( var i = 0 ; i < socketList.length ; i++ )
          {
            socketList[i].write ( str ) ;
            if ( e.isResultRequested() )
            {
              break ;
            }
          }
        }
      }
    });
  });
};
util.inherits ( GPBroker, EventEmitter ) ;
GPBroker.prototype.ejectSocket = function ( socket )
{
  var sid = socket.sid ;
  if ( ! sid ) return ;
  var ctx = this._sockets[sid] ;
  if ( ! ctx ) return ;
  if ( ctx.eventNameList )
  {
    for  ( i = 0 ; i < ctx.eventNameList.length ; i++ )
    {
      this._eventNameToSockets.remove ( ctx.eventNameList[i], socket ) ;
    }
  }
  delete this._sockets[sid] ;
  Log.info ( 'Socket disconnected, sid=' + sid ) ;
};
GPBroker.prototype.closeAllSockets = function ( exceptSocket )
{
  if ( this.closing )
  {
    return ;
  }
  this.closing = true ;
  var list = Object.keys ( this._sockets ) ;
  var e = new NEvent ( "system", "shutdown" ) ;
  for ( var i = 0 ; i < list.length ; i++ )
  {
    var ctx = this._sockets[list[i]] ;
    if ( ctx.socket === exceptSocket )
    {
      continue ;
    }
    ctx.socket.write ( e.serialize() ) ;
    ctx.socket.end() ;
  }
};

GPBroker.prototype.listen = function ( port, callback )
{
  if ( port ) this.port = port ;
  if ( ! this.port )
  {
    this.port = T.getProperty ( "gepard.port", 17501 ) ;
  }
  if ( typeof callback !== 'function' )
  {
    var thiz = this ;
    callback = function() { Log.notice ( 'server bound to port=' + thiz.port ); } ;
  }
  this.server.listen ( this.port, callback ) ;
};

var host = T.getProperty ( "gepard.host" ) ;

module.exports = GPBroker ;

if ( require.main === module )
{
  var b = new GPBroker() ;
  b.listen() ;
}