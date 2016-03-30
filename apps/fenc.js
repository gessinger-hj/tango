#!/usr/bin/env node

var g = require ( "gepard" ) ;

var encryptor = require('file-encryptor');

var inp = g.getProperty ( "in" ) ;
var out = g.getProperty ( "out" ) ;
var key = g.getProperty ( "key" ) ;
var enc = g.getBool ( "enc" ) ;

usage = function ( str )
{
	if ( str )
	{
	  console.log ( str ) ;
	  console.log() ;
	}
	console.log ( "fenc - encrypt / decrypt a file" ) ;
	console.log ( "Usage: node fenc --in=<file> --out=<file> --key=<key>" ) ;
	process.exit ( 0 ) ;
}
if ( !inp || !out || !key )
{
  if ( !inp )
    usage ( "Missing --in=<file>" ) ;
  if ( !key )
    usage ( "Missing --key=<key>" ) ;
}
var denc = true ;
if ( inp.endsWith ( ".X" ) )
{
  if ( ! out )
  {
  	out = inp.substring ( 0, inp.lastIndexOf ( ".X" ) ) ;
  }
  denc = false ;
}
if ( !denc )
{
	if ( !out ) out = inp + ".X" ;
	encryptor.decryptFile ( inp, out, key, function(err) {
		if ( err )
	  	console.log ( err ) ;
		else
			console.log ( "done" ) ;
	});
}
else
{
	if ( !out ) out = inp + ".X" ;
	encryptor.encryptFile ( inp, out, key, function(err) {
		if ( err )
	  	console.log ( err ) ;
		else
			console.log ( "done" ) ;
	});
}
