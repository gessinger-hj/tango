var T = require ( "./Tango" ) ;
var GPClient = require ( "./GPClient" ) ;

var gpc = new GPClient() ;
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
