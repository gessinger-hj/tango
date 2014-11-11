var T = require ( "Tango" ) ;
var Log = require ( "LogFile" ) ;
var File = require ( "File" ) ;
var GPNotificationBroker = require ( "GPNotificationBroker" ) ;
var WebSocketEventProxy = require ( "gp/WebSocketEventProxy" ) ;
var Broker = require ( "gp/Broker" ) ;

Log.init ( "level=info,Xedirect=3,file=%APPNAME%.log:max=1m:v=4") ;

new Broker().listen() ;
new WebSocketEventProxy().listen() ;
new GPNotificationBroker().init() ;

var GPResourceSentinel = require ( "GPResourceSentinel" ).GPResourceSentinel ;
var DirectoryResource = require ( "GPResourceSentinel" ).DirectoryResource ;

var RS = new GPResourceSentinel() ;
RS.init() ;

var watchList = new File ( __dirname, "SysApp.json" ).getJSON() ;
console.log ( watchList ) ;
for ( var i = 0 ; i < watchList.length ; i++ )
{
	RS.addChange ( new DirectoryResource ( watchList[i] ) ) ;
}
RS.client.on ( "getWatchResourceList", function ( e )
{
	e.data.watchList = watchList ;
  this.sendResult ( e ) ;
});
/*
jsdoc -d ../doc -t ../../node_modules/ink-docstrap/template/ -c ../../node_modules/ink-docstrap/template/conf.json *.js
 */
