var T = require ( "./Tango" ) ;
var Client = require ( "./gp/Client" ) ;

if ( require.main === module )
{
	var gpc = new Client() ;
// gpc.addEventListener ( "notification", function(e)
// {
//   T.log ( e.body.id ) ;
// });
	// gpc.on ( "message-test", function(e)
	// {
	//   T.log ( e ) ;
	//   gpc.sendResult ( e ) ;
	// });
	// gpc.on ( "tail.*", function(e)
	// {
	//   T.log ( e ) ;
	//   gpc.removeEventListener ( "tail.*" ) ;
	// });h
	gpc.on ( "tail.log", function(e)
	{
	  T.log ( e.body.text ) ;
	});
	gpc.on('end', function()
	{
	  console.log('socket disconnected');
	});
	gpc.on('shutdown', function()
	{
	  console.log('broker shut down');
	});
}
