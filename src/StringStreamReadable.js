var stream = require('stream');
var util = require('util');

/**
 * @constructor
 * @extends stream.Readable
 */
StringStreamReadable = function ( inputBufferOrString, options )
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
    return ;
  }
  this.push  ( this._buffer ) ;
  this.done = true ;
};
StringStreamReadable.prototype.toString = function()
{
  return this._buffer.toString() ;
};
StringStreamReadable.prototype.flush = function()
{
  delete this._buffer ;
};
module.exports = StringStreamReadable ;

if ( require.main === module )
{
  var r = new StringStreamReadable ( "XXXXdfg dfg dfgl dfg adfg afg adf g adfg adfg adf" ) ;
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