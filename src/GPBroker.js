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


var GPConnection = function ( broker, socket )
{
  this.broker     = broker ;
  this.socket     = socket ;
  this.info       = "none" ;
  if ( ! this.socket.sid )
  {
    this.sid        = socket.remoteAddress + "_" + socket.remotePort ;
    this.socket.sid = this.sid ;
  }
  else
  {
    this.sid = socket.sid ;
  }
};
GPConnection.prototype.toString = function()
{
  return "(GPConnection)[]" ;
};
GPConnection.prototype.removeEventListener = function ( e )
{
  var i, index ;
  var eventNameList = e.data.eventNameList ;
  if ( ! eventNameList || ! eventNameList.length )
  {
    eventNameList = this.eventNameList ;
  }
  if ( ! eventNameList || ! eventNameList.length )
  {
    e.control.status = { code:1, name:"error", reason:"Missing eventNameList" } ;
    Log.error ( e.toString() ) ;
    return ;
  }
  var toBeRemoved = [] ;
  for  ( i = 0 ; i < eventNameList.length ; i++ )
  {
    this.broker._eventNameToSockets.remove ( eventNameList[i], this.socket ) ;
    index  = this.eventNameList.indexOf ( eventNameList[i] ) ;
    if ( index >= 0 )
    {
      toBeRemoved.push ( eventNameList[i] ) ;
    }
    index = this._patternList.indexOf ( eventNameList[i] ) ;
    if ( index >= 0 )
    {
      this._patternList.remove ( index ) ;
      this._regexpList.remove ( index ) ;
    }
  }
  for  ( i = 0 ; i < toBeRemoved.length ; i++ )
  {
    this.eventNameList.remove ( toBeRemoved[i] ) ;
  }
  toBeRemoved.length = 0 ;
};
GPConnection.prototype.write = function ( data )
{
  if ( data instanceof GPEvent )
  {
    this.socket.write ( data.serialize() ) ;
  }
  if ( typeof data === 'string' )
  {
    this.socket.write ( data ) ;
  }
};
GPConnection.prototype.sendInfoRequest = function ( e )
{
  var i ;
  e.setType ( "getInfoResult" ) ;
  e.control.status = { code:0, name:"ack" } ;
  e.data.log = { levelName: Log.getLevelName(), level:Log.getLevel() } ;
  e.data.currentEventNames = this.broker._eventNameToSockets.getKeys() ;
  for ( i = 0 ; i < this.broker._connectionList.length ; i++ )
  {
    list = this.broker._connectionList[i]._regexpList ;
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
  for ( key in this.broker._eventNameToSockets._hash )
  {
    var afrom = this.broker._eventNameToSockets.get ( key ) ;
    if ( typeof ( afrom ) === 'function' ) continue ;
    for ( var ii = 0 ; ii < afrom.length ; ii++ )
    {
      mhclone.put ( key, afrom[ii].sid ) ;
    }
  }
  e.data.mapping = mhclone._hash ;
  var kk ;
  e.data.connectionList = [] ;
  for ( kk in this.broker._connections )
  {
    var client_info = this.broker._connections[kk].client_info ;
    if ( ! client_info ) continue ;
    e.data.connectionList.push ( client_info ) ;
  }
  this.write ( e ) ;
};
GPConnection.prototype.addEventListener = function ( e )
{
  var eventNameList = e.data.eventNameList ;
  if ( ! eventNameList || ! eventNameList.length )
  {
    e.control.status = { code:1, name:"error", reason:"Missing eventNameList" } ;
    Log.error ( e.toString() ) ;
    this.write ( e ) ;
    return ;
  }
  if ( ! this.eventNameList ) this.eventNameList = [] ;

  for  ( i = 0 ; i < eventNameList.length ; i++ )
  {
    str = eventNameList[i] ;
    if ( str.indexOf ( "*" ) < 0 )
    {
      this.eventNameList.push ( str ) ;
    }
    else
    {
      if ( ! this._regexpList )
      {
        this._regexpList = [] ;
        this._patternList = [] ;
      }
      this._patternList.push ( str ) ;
      str = str.replace ( /\./, "\\." ).replace ( /\*/, ".*" ) ;
      regexp = new RegExp ( str ) ;
      this._regexpList.push ( regexp ) ;
    }
  }
  for  ( i = 0 ; i < eventNameList.length ; i++ )
  {
    str = eventNameList[i] ;
    if ( str.indexOf ( "*" ) < 0 )
    {
      this.broker._eventNameToSockets.put ( str, this.socket ) ;
    }
  }
  e.control.status = { code:0, name:"ack" } ;
  this.write ( e ) ;
};

/**
 * @constructor
 * @extends {EventEmitter}
 * @param {} port
 * @param {} ip
 */
var GPBroker = function ( port, ip )
{
  EventEmitter.call ( this ) ;
  this._connections = {} ;
  this._eventNameToSockets = new MultiHash() ;
  this._connectionList = [] ;
  this.port = port ;
  this.ip = ip ;
  this.closing = false ;
  var thiz = this ;
  var conn ;
  this._multiplexerList = [] ;
  this.server = net.createServer() ;
  this.server.on ( "error", function onerror ( p )
  {
    Log.error ( p ) ;
    this.emit ( "error" ) ;
  });
  this.server.on ( "close", function onclose ( p )
  {
    Log.info ( p ) ;
    this.emit ( "close" ) ;
  });
  this.server.on ( "connection", function server_on_connection ( socket )
  {
    if ( thiz.closing )
    {
      socket.end() ;
      return ;
    }
    conn = new GPConnection ( thiz, socket ) ;
    thiz._connections[conn.sid] = conn ;
    thiz._connectionList.push ( conn ) ;
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
            conn = thiz._connections[sid] ;
            if ( conn )
            {
              conn.write ( e ) ;
            }
            continue ;
          }
          if ( e.getName() === 'system' )
          {
            thiz.handleSystemMessages ( this, e ) ;
            continue ;
          }
          thiz.sendEventToClients ( socket, e ) ;
        }
      }
    });
  });
};
util.inherits ( GPBroker, EventEmitter ) ;

GPBroker.prototype.toString = function()
{
  return "(GPBroker)[]" ;
};
GPBroker.prototype.sendEventToClients = function ( socket, e )
{
  var i, found = false, done = false, str ;
  var name = e.getName() ;
  e.setSourceIdentifier ( socket.sid ) ;
  var str = e.serialize() ;
  var socketList = this._eventNameToSockets.get ( name ) ;
  if ( socketList )
  {
    found = true ;
    for ( i = 0 ; i < socketList.length ; i++ )
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
    for ( i = 0 ; i < this._connectionList.length ; i++ )
    {
      list = this._connectionList[i]._regexpList ;
      if ( ! list ) continue ;
      for ( j = 0 ; j < list.length ; j++ )
      {
        if ( ! list[j].test ( name ) ) continue ;
        found = true ;
        this._connectionList[i].socket.write ( str ) ;
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
      socket.write ( e.serialize() ) ;
      return ;
    }
    done = false ;
    str = null ;
    for ( i = 0 ; i < this._multiplexerList.length ; i++ )
    {
      if ( socket === this._multiplexerList[i] ) continue ;
      if ( ! str )
      {
        str = e.serialize() ;
      }
      done = true ;
      this._multiplexerList[i].write ( str ) ;
    }
    if ( ! done )
    {
      Log.info ( "No listener found for " + e.getName() ) ;
    }
  }
};
GPBroker.prototype.handleSystemMessages = function ( socket, e )
{
  var conn ;
  if ( e.getType() === "addMultiplexer" )
  {
    this._multiplexerList.push ( socket ) ;
    conn = thiz._connections[socket.sid] ;
    conn.isMultiplexer = true ;
  }
  else
  if ( e.getType() === "shutdown" )
  {
    Log.notice ( 'server shutting down' ) ;
    e.control.status = { code:0, name:"ack" } ;
    socket.write ( e.serialize() ) ;
    this.closeAllSockets() ;
    this.server.unref() ;
    Log.notice ( 'server shut down' ) ;
    this.emit ( "shutdown" ) ;
  }
  else
  if ( e.getType() === "client_info" )
  {
    conn = this._connections[socket.sid] ;
    conn.client_info = e.data ; e.data = {} ;
    conn.client_info.sid = socket.sid ;
  }
  else
  if ( e.getType() === "getInfoRequest" )
  {
    conn = new GPConnection ( this, socket )
    conn.sendInfoRequest ( e ) ;
  }
  else
  if ( e.getType() === "addEventListener" )
  {
    conn = this._connections[socket.sid] ;
    conn.addEventListener ( e ) ;
  }
  else
  if ( e.getType() === "removeEventListener" )
  {
    conn = this._connections[socket.sid] ;
    conn.removeEventListener ( e ) ;
  }
  else
  {
    Log.error ( "Invalid type: '" + e.getType() + "' for " + e.getName() ) ;
    Log.error ( e.toString() ) ;
  }
};
/**
 * Description
 * @param {} socket
 */
GPBroker.prototype.ejectSocket = function ( socket )
{
  var sid = socket.sid ;
  if ( ! sid ) return ;
  var conn = this._connections[sid] ;
  if ( ! conn ) return ;

  this._multiplexerList.remove ( socket ) ;

  if ( conn.eventNameList )
  {
    for  ( i = 0 ; i < conn.eventNameList.length ; i++ )
    {
      this._eventNameToSockets.remove ( conn.eventNameList[i], socket ) ;
    }
  }
  this._connectionList.remove ( conn ) ;
  delete this._connections[sid] ;
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
  var list = Object.keys ( this._connections ) ;
  var e = new GPEvent ( "system", "shutdown" ) ;
  for ( var i = 0 ; i < list.length ; i++ )
  {
    var conn = this._connections[list[i]] ;
    if ( conn.socket === exceptSocket )
    {
      continue ;
    }
    conn.socket.write ( e.serialize() ) ;
    conn.socket.end() ;
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
