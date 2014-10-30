var T = require ( "./Tango" ) ;
var Event = require ( "./gp/Event" ) ;
var Client = require ( "./gp/Client" ) ;

/**
 * Description
 * @constructor
 * @param {} port
 * @param {} host
 */
var GPNotificationBroker = function ( port, host )
{
	this.client = new Client ( port, host ) ;
	this.pendingProgressNotificationList = [] ;
	this.pendingProgressNotifications = {} ;
};
/**
 * Description
 */
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
			var ee = new Event ( "notification" ) ;
			ee.data.state = "stop" ;
			thiz.client.fireEvent ( ee ) ;
		}
		thiz.pendingProgressNotifications.length = 0 ;
	});
	thiz.client.addEventListener ( "notify", function(e)
	{
		var i ;
		var ee = new Event ( "notification" ) ;
		ee.data = e.data ;
		if ( e.data.state === "start" && e.data.id )
		{
			if ( thiz.pendingProgressNotifications[e.data.id] )
			{
				return ;
			}
			thiz.pendingProgressNotificationList.push ( e.data ) ;
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
			delete thiz.pendingProgressNotifications[e.data.id] ;
		}
		thiz.client.fireEvent ( ee ) ;
	});
};
module.exports = GPNotificationBroker ;

if ( require.main === module )
{
	var ep = new GPNotificationBroker().init() ;
}
