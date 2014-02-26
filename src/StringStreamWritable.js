var stream = require('stream');
var util = require('util');

/**
 * @constructor
 * @extends stream.Writable
 */
StringStreamWritable = function()
{
  // allow use without new operator
  if (!(this instanceof StringStreamWritable)) {
    return new StringStreamWritable ( "utf8" ) ;
  }
  stream.Writable.call ( this, arguments ) ; // init super
  this._buffer = new Buffer('') ;
}
util.inherits(StringStreamWritable, stream.Writable);

StringStreamWritable.prototype._write = function ( chunk, enc, cb )
{
  var buffer = (Buffer.isBuffer(chunk))
              ? chunk  // already is Buffer use it
                : new Buffer(chunk, enc)  // string, convert
             ;
  this._buffer = Buffer.concat( [ this._buffer, buffer ] ) ;
  cb();
};
StringStreamWritable.prototype.toString = function()
{
  return this._buffer.toString() ;
};
StringStreamWritable.prototype.flush = function()
{
  delete this._buffer ;
};
module.exports = StringStreamWritable ;
