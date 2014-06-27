var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var GPClient = require ( "GPClient" ) ;
var MultiHash = require ( "MultiHash" ) ;

var client = new GPClient() ;
var pendingProgressNotifications = [] ;
client.addEventListener ( "getPendingNotifications", function(e)
{
	e.data = pendingProgressNotifications ;
	client.sendResult ( e ) ;
});
client.addEventListener ( "cleanupPendingNotifications", function(e)
{
	pendingProgressNotifications.length = 0 ;
});
client.addEventListener ( "notify", function(e)
{
	e.setName ( "notification" ) ;
	client.fireEvent ( e ) ;
	if ( e.data.state === "start" && e.data.id )
	{
		pendingProgressNotifications.push ( e.data ) ;
	}
	else
	if ( e.data.state === "stop" && e.data.id )
	{
    for ( var i = 0 ; i < pendingProgressNotifications.length ; i++ )
     {
     	if ( pendingProgressNotifications[i].id === e.data.id )
     	{
        pendingProgressNotifications.splice ( i, 1 ) ;
     	}
    }
	}
});
