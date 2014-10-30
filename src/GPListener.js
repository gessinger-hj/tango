var T = require ( "./Tango" ) ;
var Client = require ( "./gp/Client" ) ;

if ( require.main === module )
{
	var gpc = new Client() ;
// gpc.addEventListener ( "notification", function(e)
// {
//   T.log ( e.data.id ) ;
// });
	gpc.on ( "tail.*", function(e)
	{
	  T.log ( e ) ;
	  gpc.removeEventListener ( "tail.*" ) ;
	});
	// gpc.on ( "tail.log.log", function(e)
	// {
	//   T.log ( e ) ;
	// });
	gpc.on('end', function()
	{
	  console.log('socket disconnected');
	});
	gpc.on('shutdown', function()
	{
	  console.log('broker shut down');
	});
}
