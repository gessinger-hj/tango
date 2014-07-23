var Path = require ( "path" ) ;
var dir = Path.join ( __dirname, "/src/" ) ;

var tango = o = require ( Path.join ( dir, "./Tango" ) ) ;

tango._vetoHash = {} ;
for ( var k in tango )
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
			o[k] = res[k] ;
		}
	}
	else
	{
		var n = a[i].substring ( 0, a[i].indexOf ( '.' ) ) ;
		o[n] = require ( fname ) ;
	}
}
a.length = 0 ;

module.exports = o ;
