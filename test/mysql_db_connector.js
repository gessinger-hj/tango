var mysql = require ( 'mysql2' ) ;

var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var Client = require ( "Client" ) ;
var Log = require ( "LogFile" ) ;
var Xml = require ( 'Xml' ).Xml ;
var XmlTree = require ( 'Xml' ).XmlTree ;

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
  var dburl = T.getProperty ( "dburl", "mysql://root:@localhost/" ) ;
  var connection =  mysql.createConnection ( dburl ) ;
  // var connection =  mysql.createConnection (
  // {
  // 	host : "localhost",
  // 	user : "root",
  // 	password: ""
  // });
  connection.connect();
	connection.query( "use cdcol" );
	// var str = "select * from cds where titel='Glee'";	
	var str = "select * from cds where Xtitel=?";	
	var tree = new XmlTree() ;
	e.data.RESULT = tree ;
	var tab = tree.add ( "cds" ) ;
  
	connection.execute ( str, [ "Glee" ], function ( err, rows )
	{
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
		// console.log ( tree.toString() ) ;
		client.sendResult ( e ) ;
	});
});
client.on('end', function()
{
  console.log('socket disconnected');
});
