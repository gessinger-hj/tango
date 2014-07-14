var T = require ( "Tango" ) ;
var GPNotificationBroker = require ( "GPNotificationBroker" ) ;
var GPWebSocketEventProxy = require ( "GPWebSocketEventProxy" ) ;
var GPBroker = require ( "GPBroker" ) ;

T.setProperty ( "tango.env", "level=info,redirect=3") ;

new GPBroker().listen() ;
new GPWebSocketEventProxy().listen() ;
new GPNotificationBroker().init() ;
