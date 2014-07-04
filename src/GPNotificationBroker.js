var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var GPClient = require ( "GPClient" ) ;
var MultiHash = require ( "MultiHash" ) ;

var client = new GPClient() ;
var pendingProgressNotificationEventList = [] ;
var pendingProgressNotificationList = [] ;
var pendingProgressNotifications = {} ;

client.addEventListener ( "getPendingNotifications", function(e)
{
	e.data = pendingProgressNotificationList ;
	client.sendResult ( e ) ;
});
client.addEventListener ( "cleanupPendingNotifications", function(e)
{
	for ( var i = 0 ; i < pendingProgressNotificationEventList.length ; i++ )
	{
		e.data.state = "stop" ;
		client.fireEvent ( e ) ;
	}
	pendingProgressNotifications.length = 0 ;
});
client.addEventListener ( "notify", function(e)
{
T.log ( e ) ;
	var i ;
	e.setName ( "notification" ) ;
	if ( e.data.state === "start" && e.data.id )
	{
		if ( pendingProgressNotifications[e.data.id] )
		{
			return ;
		}
		pendingProgressNotificationList.push ( e.data ) ;
		pendingProgressNotificationEventList.push ( e ) ;
		pendingProgressNotifications[e.data.id] = e.data ;
	}
	else
	if ( e.data.state === "stop" && e.data.id )
	{
	  for ( i = 0 ; i < pendingProgressNotificationList.length ; i++ )
	  {
	   	if ( pendingProgressNotificationList[i].id === e.data.id )
	   	{
	      pendingProgressNotificationList.splice ( i, 1 ) ;
	   	}
    }
	  for ( i = 0 ; i < pendingProgressNotificationEventList.length ; i++ )
	  {
	   	if ( pendingProgressNotificationEventList[i].data.id === e.data.id )
	   	{
	      pendingProgressNotificationEventList.splice ( i, 1 ) ;
	   	}
    }
		delete pendingProgressNotifications[e.data.id] ;
	}
	client.fireEvent ( e ) ;
});
