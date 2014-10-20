#!/usr/bin/node

/**
 * [net description]
 * @type {[type]}
 */
var net = require ( 'net' ) ;
var util = require ( 'util' ) ;
var EventEmitter = require ( "events" ).EventEmitter ;
var GPEvent = require ( "./GPEvent" ) ;
var T = require ( "./Tango" ) ;
var MultiHash = require ( "./MultiHash" ) ;
var Log = require ( "./LogFile" ) ;


var GPSocket = function ( socket )
{
  this.sid = socket.remoteAddress + "_" + socket.remotePort ;
  this.socket = socket ;
  this.socket.sid = this.sid ;
  this.info = "none" ;
}
/**
 * @constructor
 * @extends {EventEmitter}
 * @param {} port
 * @param {} ip
 */
var GPBroker = function ( port, ip )
{
  EventEmitter.call ( this ) ;
  this._sockets = {} ;
  this._eventNameToSockets = new MultiHash() ;
  this._socketList = [] ;
  this.port = port ;
  this.ip = ip ;
  this.closing = false ;
  var thiz = this ;
  var ctx ;
  this._multiplexerList = [] ;
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
    
    // var sid = socket.remoteAddress + "_" + socket.remotePort ;
    // socket.sid = sid ;
    // thiz._sockets[sid] = { sid:sid, socket:socket, info:"none" } ;
    var s = new GPSocket ( socket ) ;
    thiz._sockets[s.sid] = s ;
    thiz._socketList.push ( s ) ;
    Log.info ( 'Socket connected' );
    socket.on ( "error", thiz.ejectSocket.bind ( thiz, socket ) ) ;
    socket.on ( 'close', thiz.ejectSocket.bind ( thiz, socket ) ) ;
    socket.on ( 'end', thiz.ejectSocket.bind ( thiz, socket ) ) ;
    socket.on ( "data", function socket_on_data ( chunk )
    {
      var mm = chunk.toString() ;
      if ( thiz.closing )
      {
        return ;
      }
      var i, j, found ;
      var eventNameList ;
      var eOut ;
      var str ;
      var key ;
      var sid ;
      var index ;
      var regexp ;
      var name ;
      var list ;

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
          var e = GPEvent.prototype.deserialize ( m ) ;
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
            if ( e.getType() === "addMultiplexer" )
            {
              thiz._multiplexerList.push ( this ) ;
              ctx = thiz._sockets[this.sid] ;
              ctx.isMultiplexer = true ;
              return ;
            }
            if ( e.getType() === "shutdown" )
            {
              Log.notice ( 'server shutting down' ) ;
              e.control.status = { code:0, name:"ack" } ;
              this.write ( e.serialize() ) ;
              thiz.closeAllSockets ( ) ; //this ) ;
              thiz.server.unref() ;
              Log.notice ( 'server shut down' ) ;
              thiz.emit ( "shutdown" ) ;
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
              e.data.log = { levelName: Log.getLevelName(), level:Log.getLevel() } ;
              e.data.currentEventNames = thiz._eventNameToSockets.getKeys() ;
              for ( i = 0 ; i < thiz._socketList.length ; i++ )
              {
                list = thiz._socketList[i]._regexpList ;
                if ( list )
                {
                  if ( ! e.data.currentEventPattern ) e.data.currentEventPattern = [] ;
                  for ( j = 0 ; j < list.length ; j++ )
                  {
                    e.data.currentEventPattern.push ( list[j].toString() ) ;
                  }
                }
              }     

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
              if ( ! ctx.eventNameList ) ctx.eventNameList = [] ;

              for  ( i = 0 ; i < eventNameList.length ; i++ )
              {
                str = eventNameList[i] ;
                if ( str.indexOf ( "*" ) < 0 )
                {
                  ctx.eventNameList.push ( str ) ;
                }
                else
                {
                  if ( ! ctx._regexpList )
                  {
                    ctx._regexpList = [] ;
                  }
                  str = str.replace ( /\./, "\\." ).replace ( /\*/, ".*" ) ;
                  regexp = new RegExp ( str ) ;
                  ctx._regexpList.push ( regexp ) ;
                }
              }

              for  ( i = 0 ; i < eventNameList.length ; i++ )
              {
                str = eventNameList[i] ;
                if ( str.indexOf ( "*" ) < 0 )
                {
                  thiz._eventNameToSockets.put ( str, this ) ;
                }
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
                ctx.eventNameList.remove ( toBeRemoved[i] ) ;
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
          found = false ;
          name = e.getName() ;
          e.setSourceIdentifier ( this.sid ) ;
          str = e.serialize() ;
          var socketList = thiz._eventNameToSockets.get ( name ) ;
          if ( socketList )
          {
            found = true ;
            for ( var i = 0 ; i < socketList.length ; i++ )
            {
              socketList[i].write ( str ) ;
              if ( e.isResultRequested() )
              {
                break ;
              }
            }
          }
          if ( found && e.isResultRequested() )
          {
          }
          else
          {
            for ( i = 0 ; i < thiz._socketList.length ; i++ )
            {
              list = thiz._socketList[i]._regexpList ;
              if ( ! list ) continue ;
              for ( j = 0 ; j < list.length ; j++ )
              {
                if ( ! list[j].test ( name ) ) continue ;
                found = true ;
                thiz._socketList[i].socket.write ( str ) ;
                if ( e.isResultRequested() )
                {
                  break ;
                }
              }
              if ( found && e.isResultRequested() )
              {
                break ;
              }
            }
          }
          if ( ! found )
          {
            if ( e.isResultRequested() )
            {
              e.control.status = { code:1, name:"warning", reason:"No listener found for event: " + e.getName() } ;
              e.control.requestedName = e.getName() ;
              this.write ( e.serialize() ) ;
              continue ;
            }
            done = false ;
            for ( i = 0 ; i < thiz._multiplexerList.length ; i++ )
            {
              done2 = true ;
              if ( this === thiz._multiplexerList[i] ) continue ;
              thiz._multiplexerList[i].write ( e.serialize() ) ;
            }
            if ( done ) continue ;
            Log.info ( "No listener found for " + e.getName() ) ;
            continue ;
          }
        }
      }
    });
  });
};
util.inherits ( GPBroker, EventEmitter ) ;
/**
 * Description
 * @param {} socket
 */
GPBroker.prototype.ejectSocket = function ( socket )
{
  var sid = socket.sid ;
  if ( ! sid ) return ;
  var ctx = this._sockets[sid] ;
  if ( ! ctx ) return ;

  this._multiplexerList.remove ( socket ) ;

  if ( ctx.eventNameList )
  {
    for  ( i = 0 ; i < ctx.eventNameList.length ; i++ )
    {
      this._eventNameToSockets.remove ( ctx.eventNameList[i], socket ) ;
    }
  }
  this._socketList.remove ( ctx ) ;
  delete this._sockets[sid] ;
  Log.info ( 'Socket disconnected, sid=' + sid ) ;
};
/**
 * Description
 * @param {} exceptSocket
 */
GPBroker.prototype.closeAllSockets = function ( exceptSocket )
{
  if ( this.closing )
  {
    return ;
  }
  this.closing = true ;
  var list = Object.keys ( this._sockets ) ;
  var e = new GPEvent ( "system", "shutdown" ) ;
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

/**
 * Description
 * @param {} port
 * @param {} callback
 */
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
    /**
     * Description
     */
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
