var util = require ( "util" ) ;
var fs = require ( "fs" ) ;
var stream = require ( 'stream' ) ;
var Utils = require ( "Utils" ) ;
/**
 *  @constructor
 */
var CsvReader = function ( lineReader )
{
  var options = { objectMode: true } ;
  stream.Readable.call ( this, options ) ;

	var thiz = this ;

	lineReader.on ( "line", function online(line)
	{
		try
		{
			var a = Utils.splitCsv ( line ) ;
			thiz.emit ( "array", a ) ;
		}
		catch ( exc )
		{
			thiz.emit ( "error", exc ) ;
		}
	});
	lineReader.on ( "end", function rs_onend()
	{
		thiz.emit ( "end" ) ;
	});
}
util.inherits ( CsvReader, stream.Readable ) ;

module.exports = CsvReader ;
