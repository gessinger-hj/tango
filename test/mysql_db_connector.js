var mysql = require ( 'mysql' ) ;

var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var Client = require ( "Client" ) ;
var Log = require ( "LogFile" ) ;
var Xml = require ( 'Xml' ).Xml ;
var XmlTree = require ( 'Xml' ).XmlTree ;

var c = new Client() ;
c.addEventListener ( "DB:REQUEST", function(e)
{
  T.lwhere (  ) ;
  T.log ( e ) ;
  e.setIsResult() ;

  var connection =  mysql.createConnection({
  	host : "localhost",
  	user : "root",
  	password: ""
  });
console.log ( "2 --------------------------" ) ;
	  connection.connect();
console.log ( "2a --------------------------" ) ;
  	connection.query( "use cdcol" );
console.log ( "3 --------------------------" ) ;
	var strQuery = "select * from cds";	
	var tree = new XmlTree() ;
	e.data.RESULT = tree ;
	var tab = tree.add ( "cds" ) ;
  
	connection.query( strQuery, function ( err, rows )
	{
T.lwhere (  ) ;
		if ( err )
		{
			Log.error ( err ) ;
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
		}
		connection.end() ;
	});
});
c.on('end', function()
{
  console.log('socket disconnected');
});
