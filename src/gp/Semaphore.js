var T      = require ( "../Tango" ) ;
var Event  = require ( "./Event" ) ;
var Client = require ( "./Client" ) ;

/**
 * Description
 * @constructor
 * @param {int} [port]
 * @param {string} [host]
 * @return 
 */
Semaphore = function ( port, host )
{
  this.className = "Semaphore" ;
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
  this._isSemaphoreOwner = false ;
};
/**
 * Description
 * @method toString
 * @return BinaryExpression
 */
Semaphore.prototype.toString = function()
{
  return "(" + this.className + ")[resourceId=" + this._resourceId + ",isOwner=" + this._isSemaphoreOwner + "]" ;
};
/**
 * Description
 * @method aquire
 * @param {} resourceId
 * @param {} callback
 * @return 
 */
Semaphore.prototype.aquire = function ( resourceId, callback )
{
  if ( ! this._client )
  {
    this._client = new Client ( this._port, this._host ) ;
  }
  this._resourceId = resourceId ;
  this._callback = callback ;
  this._client.aquireSemaphore ( resourceId, this._aquireSemaphoreCallback.bind ( this ) ) ;
};
Semaphore.prototype._aquireSemaphoreCallback = function ( err, e )
{
  if ( ! err )
  {
    this._aquireSemaphoreResult = e ;
    this._isSemaphoreOwner = e.body.isSemaphoreOwner ;
  }
  this._callback.call ( this, err, this ) ;
};
/**
 * Description
 * @method isOwner
 * @return MemberExpression
 */
Semaphore.prototype.isOwner = function()
{
  return this._isSemaphoreOwner ;
};
/**
 * Description
 * @method release
 * @return 
 */
Semaphore.prototype.release = function()
{
  if ( ! this._isSemaphoreOwner )
  {
    return ;
  }
  this._isSemaphoreOwner = false ;
  this._client.releaseSemaphore ( this._resourceId ) ;
  if ( this._isClientOwner && this._client )
  {
    this._client.end() ;
    this._client = null ;
  }
};
module.exports = Semaphore ;
if ( require.main === module )
{
  var key = T.getProperty ( "key", "user:4711" ) ;
  var auto = T.getProperty ( "auto" ) ;
  var sem = new Semaphore () ;
  sem.aquire ( key, function ( err, l )
  {
    // console.log ( "err=" + err ) ;
    console.log ( this.toString() ) ;
    if ( auto )
    {
      this.release() ;
    }
  } ) ;
}