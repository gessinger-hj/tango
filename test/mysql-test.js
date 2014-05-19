var mysql =  require('mysql');

console.log ( "1 --------------------------" ) ;
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
  
  connection.query( strQuery, function(err, rows){
  	if(err)	{
  		throw err;
  	}else{
  		for ( var i = 0 ; i < rows.length ; i++ )
  		{
  		console.log( rows[i] );
  		}
  	}
  	connection.end() ;
  });