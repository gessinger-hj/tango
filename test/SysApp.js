var T = require ( "Tango" ) ;
var GPNotificationBroker = require ( "GPNotificationBroker" ) ;
var GPWebSocketEventProxy = require ( "GPWebSocketEventProxy" ) ;
var GPBroker = require ( "GPBroker" ) ;

new GPBroker().listen() ;
new GPNotificationBroker().init() ;
new GPWebSocketEventProxy().listen() ;
