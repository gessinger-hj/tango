var T = require ( "Tango" ) ;
var Log = require ( "LogFile" ) ;
var GPNotificationBroker = require ( "GPNotificationBroker" ) ;
var GPWebSocketEventProxy = require ( "GPWebSocketEventProxy" ) ;
var GPBroker = require ( "GPBroker" ) ;

Log.init ( "level=info,Xedirect=3,file=%APPNAME%.log:max=1m:v=4") ;

new GPBroker().listen() ;
new GPWebSocketEventProxy().listen() ;
new GPNotificationBroker().init() ;
