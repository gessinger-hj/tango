var T = require ( "./Tango" ) ;
var GPClient = require ( "./GPClient" ) ;

var gpc = new GPClient() ;
gpc.addEventListener ( "notification", function(e)
{
  T.log ( e.data.id ) ;
});
gpc.addEventListener ( "tail.*", function(e)
{
  T.log ( e ) ;
});
gpc.on('end', function()
{
  console.log('socket disconnected');
});
