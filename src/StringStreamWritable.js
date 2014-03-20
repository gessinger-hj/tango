var stream = require('stream');
var util = require('util');

/**
 * @constructor
 * @extends stream.Writable
 */
StringStreamWritable = function ( enc )
{
  if ( ! enc ) enc = "utf8" ;
  if (!(this instanceof StringStreamWritable)) {
    return new StringStreamWritable ( "utf8" ) ;
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
StringStreamWritable.prototype.toString = function()
{
  return this._buffer.toString() ;
};
StringStreamWritable.prototype.flush = function()
{
  delete this._buffer ;
};
if ( typeof tangojs === 'object' && tangojs ) tangojs.StringStreamWritable = StringStreamWritable ;
else tangojs = { StringStreamWritable:StringStreamWritable } ;

module.exports = StringStreamWritable ;
