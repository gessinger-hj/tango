var mysql =  require('mysql2');
var T = require ( "Tango" ) ;
  var dburl = T.getProperty ( "dburl", "mysql://root:@localhost/cdcol" ) ;

  var connection =  mysql.createConnection ( dburl ) ;
  connection.connect();
  connection.query( "use cdcol" );
var strQuery = "select * from cds";	

connection.query( strQuery, function(err, rows, fields ){
    // console.log ( fields ) ;
  	if(err)	{
  		throw err;
  	}else{
  		for ( var i = 0 ; i < rows.length ; i++ )
  		{
  		// console.log( rows[i] );
  		}
  	}
  	connection.end() ;
  });
q.on('end', function(result) {
        console.log("(end)");
    });