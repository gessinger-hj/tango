var util = require ( "util" ) ;
var stream = require('stream');

/**
 *  @constructor
 */
var LineReader = function ( characterStream )
{
  var options = { objectMode: true } ;
  stream.Readable.call ( this, options ) ;
	var line = null ;
	var thiz = this ;
	characterStream.on ( "readable", function onreadable()
	{
		var c ;
		while ( ( c = characterStream.read(1) ) !== null )
		{
			if ( c === '\r' )
			{
				continue ;
			}
			if ( c === '\n' )
			{
				if ( line !== null )
				{
					thiz.push ( line ) ;
				}
				line = null ;
				continue ;
			}
			if ( line === null ) line = "" ;
			line += c ;
		}
	}) ;
	characterStream.on ( "end", function rs_onend()
	{
		if ( line !== null )
		{
			thiz.push ( line ) ;
		}
		thiz.emit ( "end" ) ;
	});
  this.on ( "readable", function _onreadable()
  {
		var ll = thiz.read(1) ;
		thiz.emit ( "line", ll ) ;
  });
}
util.inherits ( LineReader, stream.Readable ) ;
LineReader.prototype._read = function ( size )
{
  this.pause() ;
};

module.exports = LineReader ;
