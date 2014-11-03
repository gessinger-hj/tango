var stream = require('stream');
var util = require('util');

/**
 * @constructor
 * @param {} enc
 * @extends stream.Writable
 */
StringWritable = function ( enc )
{
  if ( ! enc ) enc = "utf8" ;
  this.enc = enc ;
  if (!(this instanceof StringWritable)) {
    return new StringWritable ( this.enc ) ;
  }
  stream.Writable.call ( this, arguments ) ;
  this._buffer = new Buffer('') ;
}
util.inherits(StringWritable, stream.Writable);

StringWritable.prototype._write = function ( chunk, enc, cb )
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
 * @return CallExpression
 */
StringWritable.prototype.toString = function()
{
  return this._buffer.toString ( this.enc ) ;
};
/**
 * Description
 */
StringWritable.prototype.flush = function()
{
  delete this._buffer ;
};
module.exports = StringWritable ;
