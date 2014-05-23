var mysql = null ;
var pg = null ; 

var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var Client = require ( "Client" ) ;
var Log = require ( "LogFile" ) ;
var XmlTree = require ( 'Xml' ).XmlTree ;

var dburl = T.getProperty ( "dburl" ) ;
// var dburl = T.getProperty ( "dburl", "mysql://root:@localhost/cdcol" ) ;
// var dburl = "postgres://gess:luap1997@localhost:5432/gess";

var client = new Client() ;
client.addEventListener ( "DB:REQUEST", function(e)
{
  // T.lwhere (  ) ;
  T.log ( e ) ;
  if ( ! e.isResultRequested() )
  {
		Log.error ( "No result requested in event." ) ;
		Log.error ( e ) ;
    return ;
  }

	var connection = null ;
  if ( dburl.indexOf ( "postgres" ) === 0 )
  {
		if ( ! pg )    pg = require('pg');
		
		connection = new pg.Client ( dburl ) ;
		var tree = new XmlTree() ;
		e.data.RESULT = tree ;
		var tab = tree.add ( "cds" ) ;
		connection.connect ( function ( err )
		{
		  if ( err )
		  {
				Log.error ( "could not connect to postgres: " + err ) ;
	      e.control.status = { code:1, name:"error", reason:"" + err } ;
				connection.end() ;
				client.sendResult ( e ) ;
		    return ;
		  }
		  var sql = 'SELECT i.*, t.identity_type_name from t_identity i, t_identity_type t where i.identity_type_key=t.identity_type_key' ;
		  connection.query ( sql, function ( err, result )
		  {
		    if ( err )
				{
					Log.error ( "" + err + " in \n" + sql ) ;
		      e.control.status = { code:1, name:"error", reason:"" + err } ;
					connection.end() ;
					client.sendResult ( e ) ;
					return ;
			 	}
		    var n = result.rows.length ;
	  		for ( var i = 0 ; i < n ; i++ )
		    {
		      var xr = tab.add ( "row" ) ;
		      var r = result.rows[i] ;
		      for ( k in r )
		      {
		        var v = r[k] ;
		        if ( v === null ) continue ;
		        xr.add ( k, v ) ;
		      }
		    }
		    connection.end();
				console.log ( tree.toString() ) ;
	    	e.control.status = { code:0 } ;
				client.sendResult ( e ) ;
	  	}) ;
  	}) ;
  }
  else
  if ( dburl.indexOf ( "mysql" ) === 0 )
  {
		if ( ! mysql ) mysql = require ( 'mysql2' ) ;
	  connection =  mysql.createConnection ( dburl ) ;
	  // var connection =  mysql.createConnection (
	  // {
	  // 	host : "localhost",
	  // 	user : "root",
	  // 	password: ""
	  // });
	  connection.connect();
		// connection.query( "use cdcol" );
		// var str = "select * from cds where titel='Glee'";	
		var str = "select * from cds where titel=?";	
	  
		connection.execute ( str, [ "Glee" ], function ( err, rows )
		{
			var tree = new XmlTree() ;
			e.data.RESULT = tree ;
			var tab = tree.add ( "cds" ) ;
			if ( err )
			{
				Log.error ( "" + err + " in \n" + str ) ;
	      e.control.status = { code:1, name:"error", reason:"" + err } ;
				connection.end() ;
		 	}
		 	else
		 	{
		    var n = rows.length ;
				for ( var i = 0 ; i < n ; i++ )
				{
		      var xr = tab.add ( "row" ) ;
	  	    var r = rows[i] ;
		      for ( k in r )
		      {
		        var v = r[k] ;
		        if ( v === null ) continue ;
		        xr.add ( k, v ) ;
		      }
		    }
				connection.end() ;
			}
			// console.log ( e ) ;
			console.log ( tree.toString() ) ;
	    e.control.status = { code:0 } ;
			client.sendResult ( e ) ;
		});
	}
}) ;
client.on('end', function()
{
  console.log('socket disconnected');
});
