var Path = require ( "path" ) ;
var dir = Path.join ( __dirname, "/src/" ) ;

var tango = require ( Path.join ( dir, "./Tango" ) ) ;
tango._vetoHash = {} ;
for ( var k in this )
{
	tango._vetoHash[k] = true ;
}


var fs = require ( "fs" ) ;
var a = fs.readdirSync ( dir ) ;
for ( var i = 0 ; i < a.length ; i++ )
{
	if ( a[i].indexOf ( ".js" ) !== a[i].length - 3 ) continue ;
	if ( a[i] === "Tango.js" ) continue ;
	var fname = dir + a[i] ;
	if ( fs.statSync ( fname ).isDirectory() ) continue ;
	var res = require ( fname ) ;
	if ( ! res )
	{
		continue ;
	}
	if ( res.ignore ) continue ;
	if ( res.enumerate )
	{
		for ( var k in res )
		{
			if ( k === "enumerate" )
			{
				continue ;
			}
			tango[k] = res[k] ;
		}
	}
	else
	{
		var n = a[i].substring ( 0, a[i].indexOf ( '.' ) ) ;
		tango[n] = require ( fname ) ;
	}
}
a.length = 0 ;

tango._displayLoadedModules = function ()
{
	var util = require ( "util" ) ;
	
	for ( var k in this )
	{
		if ( this._vetoHash[k] ) continue ;
		if ( k.indexOf ( "_" ) === 0 ) continue ;
		var o = this[k] ;
		if ( typeof o === 'string' || typeof o === 'boolean' || typeof o === 'number' )
		{
			continue ;
		}
		process.stdout.write ( k ) ;
		if ( typeof o === 'object' )
		{
			process.stdout.write ( "={}" ) ;
		}
		else
		if ( typeof o === 'function' )
		{
			if ( util.inspect ( o.prototype, { showHidden: false, depth: 0 } ) === "{}" )
			{
				process.stdout.write ( "=(Function)" ) ;
			}
			else
			{
				process.stdout.write ( "=(Class)" ) ;
			}
		}
		else
		{
			process.stdout.write ( "=" + util.inspect ( o, { showHidden: false, depth: 0 } ) ) ;
		}
		process.stdout.write ( "\n" ) ;
	}
}

module.exports = tango ;
