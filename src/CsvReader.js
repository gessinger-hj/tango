var util   = require ( "util" ) ;
var fs     = require ( "fs" ) ;
var stream = require ( 'stream' ) ;
var Utils  = require ( "./Utils" ) ;
/**
 * @class
 * @param      {}    lineReader  The line reader
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

if ( require.main === module )
{
	var FileLineReader = require ( "./FileLineReader" ) ;
	var csvr = new CsvReader ( new FileLineReader ( process.argv[2] ).lines() ) ;
	csvr.on ( "array", function onarray(a)
	{
		console.log ( a ) ;
	});
}
