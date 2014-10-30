var T = require ( "./Tango" ) ;
var Event = require ( "./gp/Event" ) ;
var Client = require ( "./gp/Client" ) ;

var c = new Client() ;

GPLock = function ( port, host )
{
  this.className = "GPLock" ;
  if ( port instanceof Client )
  {
    this._isClientOwner = false ;
    this._client = port ;
  }
  else
  {
    this._port = port ;
    this._host = host ;
    this._isClientOwner = true ;
    this._client = new Client ( this._port, this._host ) ;
  }
  this._isLockOwner = false ;
};
GPLock.prototype.toString = function()
{
  return "(" + this.className + ")[resourceId=" + this._resourceId + ",isOwner=" + this._isLockOwner + "]" ;
};
GPLock.prototype.aquire = function ( resourceId, callback )
{
  if ( ! this._client )
  {
    this._client = new Client ( this._port, this._host ) ;
  }
  this._resourceId = resourceId ;
  this._callback = callback ;
  this._client.lockResource ( resourceId, this._lockResourceCallback.bind ( this ) ) ;
};
GPLock.prototype._lockResourceCallback = function ( err, e )
{
  this._lockResourceResult = e ;
  this._isLockOwner = e.data.isLockOwner ;
  this._callback.call ( null, err, this ) ;
  if ( ! this._isLockOwner )
  {
    if ( this._isClientOwner && this._client )
    {
      this._client.end() ;
      this._client = null ;
    }
  }
};
GPLock.prototype.isOwner = function()
{
  return this._isLockOwner ;
};
GPLock.prototype.release = function()
{
  if ( ! this._isLockOwner )
  {
    return ;
  }
  this._isLockOwner = false ;
  this._client.freeResource ( this._resourceId ) ;
  if ( this._isClientOwner && this._client )
  {
    this._client.end() ;
    this._client = null ;
  }
};
if ( require.main === module )
{
  var lock = new GPLock ( c ) ;
  lock.aquire ( "user:11", function ( err, l )
  {
    console.log ( "err=" + err ) ;
    console.log ( "l=" + l ) ;
    // l.release() ;
  } ) ;

/*
c.fire ( "tail.log", function(p)
{
  // this.end() ;
} ) ;
c.lockResource ( "4711", function ( p1, p2 )
{
  console.log ( "p1=" + p1 ) ;
  console.log ( "p2=" + p2 ) ;
  c.freeResource ( "4711" ) ;
  // this.end() ;
} ) ;
*/
/*
var ne = new Event ( "alarm", "file" ) ;
c.fire ( ne
       , { 
           result: function(e)
           {
console.log ( " ----------result: function()----------------" ) ;
             T.log ( e ) ;
             this.end() ;
           }
         , error: function(e)
           {
console.log ( " ----------error: function()----------------" ) ;
             T.log ( e ) ;
             this.end() ;
           }
         , Xwrite: function()
           {
console.log ( " ----------write: function()----------------" ) ;
              // this.end() ;
           }
         }
       ) ;
*/
// c.on('end', function()
// {
//   console.log('socket disconnected');
// });
}
