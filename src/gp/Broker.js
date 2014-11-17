//#!/usr/bin/node

/**
 * [net description]
 * @type {[type]}
 */
var net          = require ( 'net' ) ;
var util         = require ( 'util' ) ;
var EventEmitter = require ( "events" ).EventEmitter ;
var Event        = require ( "./Event" ) ;
var T            = require ( "../Tango" ) ;
var MultiHash    = require ( "../MultiHash" ) ;
var Log          = require ( "../LogFile" ) ;


/**
 * Description
 * @constructor Connection
 * @param {} broker
 * @param {} socket
 * @return 
 */
var Connection = function ( broker, socket )
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
  this._lockedResourcesIdList = [] ;
  this._patternList = [] ;
  this._regexpList = [] ;
};
/**
 * Description
 * @method toString
 * @return Literal
 */
Connection.prototype.toString = function()
{
  return "(Connection)[]" ;
};
/**
 * Description
 * @method removeEventListener
 * @param {} e
 * @return 
 */
Connection.prototype.removeEventListener = function ( e )
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
/**
 * Description
 * @method write
 * @param {} data
 * @return 
 */
Connection.prototype.write = function ( data )
{
  if ( data instanceof Event )
  {
    this.socket.write ( data.serialize() ) ;
  }
  if ( typeof data === 'string' )
  {
    this.socket.write ( data ) ;
  }
};
/**
 * Description
 * @method sendInfoRequest
 * @param {} e
 * @return 
 */
Connection.prototype.sendInfoRequest = function ( e )
{
  var i, first, str, key ;
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
  e.data.connectionList = [] ;
  for ( key in this.broker._connections )
  {
    var client_info = this.broker._connections[key].client_info ;
    if ( ! client_info ) continue ;
    e.data.connectionList.push ( client_info ) ;
  }
  str = "" ;
  for ( key in this.broker._lockOwner )
  {
    if ( ! str )
    {
      e.data.lockList = [] ;
    }
    e.data.lockList.push ( { resourceId: key, owner: this.broker._lockOwner[key].client_info } ) ;
  }
  this.write ( e ) ;
};
/**
 * Description
 * @method addEventListener
 * @param {} e
 * @return 
 */
Connection.prototype.addEventListener = function ( e )
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
 * @method Broker
 * @param {} port
 * @param {} ip
 * @return 
 */
var Broker = function ( port, ip )
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
  this._lockOwner = {} ;
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
    conn = new Connection ( thiz, socket ) ;
    thiz._connections[conn.sid] = conn ;
    thiz._connectionList.push ( conn ) ;
    Log.info ( 'Socket connected' );
    socket.on ( "error", thiz._ejectSocket.bind ( thiz, socket ) ) ;
    socket.on ( 'close', thiz._ejectSocket.bind ( thiz, socket ) ) ;
    socket.on ( 'end', thiz._ejectSocket.bind ( thiz, socket ) ) ;
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
      var result = T.splitJSONObjects ( mm ) ;
      var messageList = result.list ;
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
            thiz._handleSystemMessages ( this, e ) ;
            continue ;
          }
          thiz._sendEventToClients ( socket, e ) ;
        }
      }
    });
  });
};
util.inherits ( Broker, EventEmitter ) ;

/**
 * Description
 * @method toString
 * @return Literal
 */
Broker.prototype.toString = function()
{
  return "(Broker)[]" ;
};
/**
 * Description
 * @method _sendEventToClients
 * @param {} socket
 * @param {} e
 * @return 
 */
Broker.prototype._sendEventToClients = function ( socket, e )
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
      if ( e.isResultRequested() && ! e.isBroadcast() )
      {
        break ;
      }
    }
  }
  if ( found && e.isResultRequested() && ! e.isBroadcast() )
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
        if ( e.isResultRequested() && ! e.isBroadcast() )
        {
          break ;
        }
      }
      if ( found && e.isResultRequested() && ! e.isBroadcast() )
      {
        break ;
      }
    }
  }
  if ( ! found )
  {
    if ( e.isResultRequested() || e.isFailureInfoRequested() )
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
      // Log.info ( "No listener found for " + e.getName() ) ;
    }
  }
};
/**
 * Description
 * @method _handleSystemMessages
 * @param {} socket
 * @param {} e
 * @return 
 */
Broker.prototype._handleSystemMessages = function ( socket, e )
{
  var conn ;
  if ( e.getType() === "addMultiplexer" )
  {
    this._multiplexerList.push ( socket ) ;
    conn = this._connections[socket.sid] ;
    conn.isMultiplexer = true ;
  }
  else
  if ( e.getType() === "shutdown" )
  {
    var shutdown_sid = e.data.shutdown_sid ;
    if ( shutdown_sid )
    {
      conn = this._connections[socket.sid] ;
      var target_conn = this._connections[shutdown_sid] ;
      if ( ! target_conn )
      {
        e.control.status = { code:1, name:"error", reason:"no connection for sid=" + shutdown_sid } ;
        socket.write ( e.serialize() ) ;
        return ;
      }
      target_conn.write ( new Event ( "system", "shutdown" ) ) ;
      target_conn.socket.end() ;
      e.control.status = { code:0, name:"ack" } ;
      socket.write ( e.serialize() ) ;
      return ;
    }
    else
    {
      Log.notice ( 'server shutting down' ) ;
      e.control.status = { code:0, name:"ack" } ;
      socket.write ( e.serialize() ) ;
      this._closeAllSockets() ;
      this.server.unref() ;
      Log.notice ( 'server shut down' ) ;
      this.emit ( "shutdown" ) ;
    }
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
    conn = new Connection ( this, socket )
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
  if ( e.getType() === "lockResourceRequest" )
  {
    conn = this._connections[socket.sid] ;
    var resourceId = e.data.resourceId ;
    e.setType ( "lockResourceResult" ) ;
    if ( this._lockOwner[resourceId] )
    {
      e.data.isLockOwner = false ;
    }
    else
    {
      this._lockOwner[resourceId] = conn ;
      conn._lockedResourcesIdList.push ( resourceId ) ;
      e.data.isLockOwner = true ;
    }
    conn.write ( e ) ;
  }
  else
  if ( e.getType() === "freeResourceRequest" )
  {
    conn = this._connections[socket.sid] ;
    var resourceId = e.data.resourceId ;
    e.setType ( "freeResourceResult" ) ;
    e.data.isLockOwner = false ;
    if ( ! this._lockOwner[resourceId] )
    {
      e.control.status = { code:1, name:"error", reason:"not owner of resourceId=" + resourceId } ;
    }
    else
    {
      e.control.status = { code:0, name:"ack" } ;
    }
    delete this._lockOwner[resourceId] ;
    conn._lockedResourcesIdList.remove ( resourceId ) ;
    conn.write ( e ) ;
  }
  else
  {
    Log.error ( "Invalid type: '" + e.getType() + "' for " + e.getName() ) ;
    Log.error ( e.toString() ) ;
  }
};
/**
 * Description
 * @method _ejectSocket
 * @param {} socket
 * @return 
 */
Broker.prototype._ejectSocket = function ( socket )
{
  var i ;
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
  for ( i = 0 ; i < conn._lockedResourcesIdList.length ; i++ )
  {
    delete this._lockOwner [ conn._lockedResourcesIdList ] ;
  }
  delete this._connections[sid] ;
  Log.info ( 'Socket disconnected, sid=' + sid ) ;
};
/**
 * Description
 * @method _closeAllSockets
 * @param {} exceptSocket
 * @return 
 */
Broker.prototype._closeAllSockets = function ( exceptSocket )
{
  if ( this.closing )
  {
    return ;
  }
  this.closing = true ;
  var list = Object.keys ( this._connections ) ;
  var e = new Event ( "system", "shutdown" ) ;
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
 * @method listen
 * @param {} port
 * @param {} callback
 * @return 
 */
Broker.prototype.listen = function ( port, callback )
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
     * @return 
     */
    callback = function() { Log.notice ( 'server bound to port=' + thiz.port ); } ;
  }
  this.server.listen ( this.port, callback ) ;
};

var host = T.getProperty ( "gepard.host" ) ;

module.exports = Broker ;

if ( require.main === module )
{
  var b = new Broker() ;
  b.listen() ;
}
