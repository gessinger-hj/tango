var spawn = require('child_process').spawn ;
var StringStreamWritable = require ( "./StringStreamWritable" ) ;
var LineReader = require ( "./LineReader" ) ;
var EventEmitter = require ( "events" ).EventEmitter ;
var util = require ( "util" ) ;

/**
 * Description
 * @constructor
 * @param {string} cmd
 * @param {string|Array<string>} args
 */
var Process = function ( cmd, args )
{
	EventEmitter.call ( this ) ;
	this.cmd = cmd ;
	if ( args )
	{
		if ( ! Array.isArray ( args ) ) this.args = [ args ] ;
		else                            this.args = args ;
	}
	this.cwd ;
	this.className = "Process" ;
};
util.inherits ( Process, EventEmitter ) ;

/**
 * Description
 * @return BinaryExpression
 */
Process.prototype.toString = function()
{
	return "(" + this.className + ")[cmd =" + this.cmd + ",args=" + this.args + ",cwd=" + this.cwd + "]" ;
};
/**
 * Description
 * @param {} callback
 */
Process.prototype.lines = function ( callback )
{
	this.callback = callback ;
	var opts =
	{ cwd: this.cwd
	, env: process.env
	} ;
	var p = spawn ( this.cmd, this.args, opts ) ;
	this._stderr = new StringStreamWritable() ;
	var thiz = this ;

	var lr = new LineReader ( p.stdout ) ;
	var thiz = this ;
	lr.on ( "end", function()
	{
		thiz.callback ( null ) ;
	});
	lr.on ( "line", function ( line )
	{
		thiz.callback ( line ) ;
	});

	// p.stdout.on ( 'data', function ( data )
	// {
	//   thiz._stdout.write ( data ) ;
	// });
	p.stderr.on ( 'data', function ( data )
	{
	  thiz._stderr.write ( data ) ;
	});

	p.on ( "close", function onclose ( exitCode )
	{
	});
	p.on ( "exit", function onexit ( exitCode, signal )
	{
		thiz.exitCode = exitCode ;
		thiz.signal = signal ;
		thiz._stderr = thiz._stderr.toString() ;
		thiz.emit ( "exit" ) ;
	});
	p.on ( "error", function onerror ( err )
	{
		thiz.emit ( "error" ) ;
	});
};
/**
 * Description
 * @param {} callback
 */
Process.prototype.asString = function ( callback )
{
	this.callback = callback ;
	var opts =
	{ cwd: this.cwd
	, env: process.env
	} ;
	var p = spawn ( this.cmd, this.args, opts ) ;
	this._stdout = new StringStreamWritable() ;
	this._stderr = new StringStreamWritable() ;
	var thiz = this ;

	p.stdout.on ( 'data', function ( data )
	{
	  thiz._stdout.write ( data ) ;
	});
	p.stderr.on ( 'data', function ( data )
	{
	  thiz._stderr.write ( data ) ;
	});

	p.on ( "close", function onclose ( exitCode )
	{
	});
	p.on ( "exit", function onexit ( exitCode, signal )
	{
		thiz.exitCode = exitCode ;
		thiz.signal = signal ;
		thiz._stdout = thiz._stdout.toString() ;
		thiz._stderr = thiz._stderr.toString() ;
		thiz.callback ( undefined, thiz ) ;
	});
	p.on ( "error", function onerror ( err )
	{
		thiz.callback ( err, thiz ) ;
	});
};
/**
 * Description
 * @return MemberExpression
 */
Process.prototype.getExitCode = function() { return this.exitCode ; };
/**
 * Description
 * @return MemberExpression
 */
Process.prototype.getSignal = function() { return this.signal ; };
/**
 * Description
 * @return MemberExpression
 */
Process.prototype.stdout = function() { return this._stdout ; };
/**
 * Description
 * @return MemberExpression
 */
Process.prototype.stderr = function() { return this._stderr ; };

module.exports = Process ;

if ( require.main === module )
{
	// var p = new Process ( "ls", [ '-lh' ] )
	// p.cwd = "/usr" ;
	// p.asString ( function asString ( err, p )
	// {
	// 	// console.log ( p.stdout() ) ;
	// 	if ( err ) console.log ( err ) ;
 //  	console.log ( 'child process exited with code ' + p.getExitCode() ) ;
	// }) ;
	var p = new Process ( "ls", [ '-lh' ] )
	p.cwd = "/usr" ;
	p.lines ( function lines ( line )
	{
		console.log ( "line=" + line ) ;
	}) ;
	p.on ( "exit", function onexit()
	{
  	console.log ( 'child process exited with code ' + p.getExitCode() ) ;
	}) ;
}
