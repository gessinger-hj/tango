var stream = require('stream');
var util = require('util');

/**
 * @constructor
 * @param {} enc
 * @return 
 * @extends stream.Writable
 */
StringStreamWritable = function ( enc )
{
  if ( ! enc ) enc = "utf8" ;
  if (!(this instanceof StringStreamWritable)) {
    return new StringStreamWritable ( enc ) ;
  }
  stream.Writable.call ( this, arguments ) ;
  this._buffer = new Buffer('') ;
}
util.inherits(StringStreamWritable, stream.Writable);

StringStreamWritable.prototype._write = function ( chunk, enc, cb )
{
  var buffer = (Buffer.isBuffer(chunk))
                ? chunk
                  : new Buffer ( chunk, enc )
             ;
  this._buffer = Buffer.concat( [ this._buffer, buffer ] ) ;
  cb();
};
/**
 * Description
 * @method toString
 * @return CallExpression
 */
StringStreamWritable.prototype.toString = function()
{
  return this._buffer.toString() ;
};
/**
 * Description
 * @method flush
 * @return 
 */
StringStreamWritable.prototype.flush = function()
{
  delete this._buffer ;
};
module.exports = StringStreamWritable ;
