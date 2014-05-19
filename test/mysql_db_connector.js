var mysql = require ( 'mysql' ) ;

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
  e.setIsResult() ;

  var connection =  mysql.createConnection({
  	host : "localhost",
  	user : "root",
  	password: ""
  });
  connection.connect();
	connection.query( "use cdcol" );
	var strQuery = "select * from cds";	
	var tree = new XmlTree() ;
	e.data.RESULT = tree ;
	var tab = tree.add ( "cds" ) ;
  
	connection.query( strQuery, function ( err, rows )
	{
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
		// console.log ( e ) ;
		// console.log ( tree.toString() ) ;
		connection.end() ;
	  if ( e.isResult() && e.isResultRequested() )
	  {
	    client.socket.write ( e.serialize() ) ;
	  }
	});
});
client.on('end', function()
{
  console.log('socket disconnected');
});
