#!/usr/bin/env node

fs = require ( "fs" ) ;
T = require ( "tango" ) ;
var nodeAssert = require ( "assert" ) ;

var expect = require('chai').expect ;
var assert = require('chai').assert ;

JSONFileComparator = function ( file1, file2 )
{
	this.file1 = file1 ;
	this.file2 = file2 ;
};
usage = function ( str )
{
	if ( str )
	{
		console.log ( str ) ;
		console.log () ;
	}
	console.log (
		"JSONFileComparator\n"
	+ "Usage: JSONFileComparator --file1=<file1> --file2=<file2> [ line.by.line=true|false ]\n"
	) ;
	process.exit ( -1 ) ;
}
var file1 = new T.File ( T.getProperty ( "file1" ) ) ;
var file2 = new T.File ( T.getProperty ( "file2" ) ) ;

if ( ! file1.exists() )
{
	usage ( "Does not exist: " + file1 ) ;
}
if ( ! file2.exists() )
{
	usage ( "Does not exist: " + file2 ) ;
}
var line_by_line = T.getBool ( "line.by.line", true ) ;

if ( line_by_line )
{
	var list1 = file1.getList() ;
	var list2 = file2.getList() ;

	var i ;
	var min = Math.min ( list1.length, list2.length ) ;
	for ( i = 0 ; i < min ; i++ )
	{
		// list1[i] = JSON.stringify ( JSON.parse ( list1[i] ) ) ;
		// list2[i] = JSON.stringify ( JSON.parse ( list2[i] ) ) ;
		var o1 = JSON.parse ( list1[i] ) ;
		var o2 = JSON.parse ( list2[i] ) ;
		try
		{
			// assert.deepStrictEqual ( o1, o2, "XXXXXXXXX" ) ;
			// assert.deepEqual ( o1, o2, "XXXXXXXXX" ) ;
			expect(o2).to.deep.equal(o1);
		}
		catch ( exc )
		{
			console.log ( exc.message ) ;
			console.log ( exc ) ;
			// console.log ( file1.getName() + ": " + list1[i] ) ;
			// console.log ( file2.getName() + ": " + list2[i] ) ;
			// console.log ( "------" ) ;
		}
	}
}
else
{
	var o1 = file1.getJSON() ;
	var o2 = file2.getJSON() ;
	try
	{
		expect(o1).to.deep.equal(o2);
	}
	catch ( exc )
	{
		console.log ( exc.message ) ;
		console.log ( exc ) ;
		// console.log ( file1.getName() + ": " + list1[i] ) ;
		// console.log ( file2.getName() + ": " + list2[i] ) ;
		// console.log ( "------" ) ;
	}
}

