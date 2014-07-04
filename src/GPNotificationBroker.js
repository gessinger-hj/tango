var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var GPClient = require ( "GPClient" ) ;

var GPNotificationBroker = function ( port, host )
{
	this.client = new GPClient ( port, host ) ;
	this.pendingProgressNotificationEventList = [] ;
	this.pendingProgressNotificationList = [] ;
	this.pendingProgressNotifications = {} ;
};
GPNotificationBroker.prototype.init = function()
{
	var thiz = this ;
	thiz.client.addEventListener ( "getPendingNotifications", function(e)
	{
		e.data = thiz.pendingProgressNotificationList ;
		thiz.client.sendResult ( e ) ;
	});
	thiz.client.addEventListener ( "cleanupPendingNotifications", function(e)
	{
		for ( var i = 0 ; i < thiz.pendingProgressNotificationEventList.length ; i++ )
		{
			e.data.state = "stop" ;
			thiz.client.fireEvent ( e ) ;
		}
		thiz.pendingProgressNotifications.length = 0 ;
	});
	thiz.client.addEventListener ( "notify", function(e)
	{
	T.log ( e ) ;
		var i ;
		e.setName ( "notification" ) ;
		if ( e.data.state === "start" && e.data.id )
		{
			if ( thiz.pendingProgressNotifications[e.data.id] )
			{
				return ;
			}
			thiz.pendingProgressNotificationList.push ( e.data ) ;
			thiz.pendingProgressNotificationEventList.push ( e ) ;
			thiz.pendingProgressNotifications[e.data.id] = e.data ;
		}
		else
		if ( e.data.state === "stop" && e.data.id )
		{
		  for ( i = 0 ; i < thiz.pendingProgressNotificationList.length ; i++ )
		  {
		   	if ( thiz.pendingProgressNotificationList[i].id === e.data.id )
		   	{
		      thiz.pendingProgressNotificationList.splice ( i, 1 ) ;
		   	}
	    }
		  for ( i = 0 ; i < thiz.pendingProgressNotificationEventList.length ; i++ )
		  {
		   	if ( thiz.pendingProgressNotificationEventList[i].data.id === e.data.id )
		   	{
		      thiz.pendingProgressNotificationEventList.splice ( i, 1 ) ;
		   	}
	    }
			delete pendingProgressNotifications[e.data.id] ;
		}
		thiz.client.fireEvent ( e ) ;
	});
};
module.exports = GPNotificationBroker ;

if ( require.main === module )
{
	var ep = new GPNotificationBroker().init() ;
}
