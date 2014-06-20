var spawn = require('child_process').spawn ;
var StringStreamWritable = require ( "StringStreamWritable" ) ;
var Promise = require('promise');

var Process = function ( cmd, args )
{
	this.cmd = cmd ;
	if ( args )
	{
		if ( ! Array.isArray ( args ) ) this.args = [ args ] ;
		else                            this.args = args ;
	}
	this.cwd ;
	this.className = "Process" ;
};
Process.prototype.toString = function()
{
	return "(" + this.className + ")[cmd =" + this.cmd + ",args=" + this.args + ",cwd=" + this.cwd + "]" ;
};
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
		// thiz.exitCode = exitCode ;
		// thiz._stdout = thiz._stdout.toString() ;
		// thiz._stderr = thiz._stderr.toString() ;
		// thiz.callback ( undefined, thiz ) ;
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
Process.prototype.getExitCode = function() { return this.exitCode ; };
Process.prototype.getSignal = function() { return this.signal ; };
Process.prototype.stdout = function() { return this._stdout ; };
Process.prototype.stderr = function() { return this._stderr ; };

module.exports = Process ;
if ( ! tangojs ) tangojs = {} ;

tangojs.Process = Process ;

if ( require.main === module )
{
	var p = new Process ( "ls", [ '-lh' ] )
	p.cwd = "/usr" ;
	p.asString ( function asString ( err, p )
	{
		console.log ( p.stdout() ) ;
		if ( err ) console.log ( err ) ;
  	console.log ( 'child process exited with code ' + p.getExitCode() ) ;
	}) ;
}
