var stream = require('stream');
var util = require('util');

/**
 * @constructor
 * @extends stream.Readable
 * @param {} inputBufferOrString
 * @param {} options
 */
var StringStreamReadable = function ( inputBufferOrString, options )
{
  var enc  = "utf8" ;
  if ( ! options ) options = { encoding:"utf8" } ;
  if ( options.encoding ) options.encoding = "utf8" ;
  stream.Readable.call ( this, options ) ;

  this._buffer = inputBufferOrString ;
  this.done = false ;
}
util.inherits ( StringStreamReadable, stream.Readable ) ;

StringStreamReadable.prototype._read = function ( size )
{
  if ( this.done )
  {
    this.push ( null ) ;
    return ;
  }
  this.push ( this._buffer ) ;
  this.done = true ;
};
/**
 * Description
 * @return CallExpression
 */
StringStreamReadable.prototype.toString = function()
{
  return this._buffer.toString() ;
};
/**
 * Description
 */
StringStreamReadable.prototype.flush = function()
{
  delete this._buffer ;
};

module.exports = StringStreamReadable ;

if ( require.main === module )
{
  var r = new StringStreamReadable ( "<xml><result><A>nÜnn</A></result></xml>" ) ;
  // r.on ( 'data', function(data)
  // {
  //   console.log ( data ) ;
  // }) ;
  for ( var i = 0 ; i < 100 ; i++ )
  {
    var c = r.read ( 1 ) ;
    if ( c === null ) break ;
    console.log ( c ) ;
  }
  if ( r instanceof stream.Readable )
  {
    console.log ( "1---------------------" ) ;
  }
}
