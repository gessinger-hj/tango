var T = require ( "Tango" ) ;
var Log = require ( "LogFile" ) ;
var File = require ( "File" ) ;
var what = T.getProperty ( "getWatchResourceList" ) ;
if ( what )
{
	var Client = require ( "gp/Client" ) ;
	new Client().request ( "getWatchResourceList"
, function result(e)
  {
    T.log ( e ) ;
    this.end() ;
  });
	return ;
}

var GPNotificationBroker = require ( "GPNotificationBroker" ) ;
var WebSocketEventProxy = require ( "gp/WebSocketEventProxy" ) ;
var Broker = require ( "gp/Broker" ) ;

Log.init ( "level=info,Xedirect=3,file=%APPNAME%.log:max=1m:v=4") ;

var b = new Broker() ;
b.listen() ;
new GPNotificationBroker().init() ;

var wse = new WebSocketEventProxy() ;
wse.listen() ;

var GPResourceSentinel = require ( "GPResourceSentinel" ).GPResourceSentinel ;
var DirectoryResource = require ( "GPResourceSentinel" ).DirectoryResource ;

var RS = new GPResourceSentinel() ;
RS.init() ;
b.on ( "shutdown", function onshutdown(e)
{
	wse.shutdown() ;
	RS.shutdown() ;
	process.exit ( 0 ) ;
});

var watchList = new File ( __dirname, "SysApp.json" ).getJSON() ;
for ( var i = 0 ; i < watchList.length ; i++ )
{
	RS.addChange ( new DirectoryResource ( watchList[i] ) ) ;
	break ;
}
RS.client.on ( "getWatchResourceList", function ( e )
{
	e.data.watchList = watchList ;
  this.sendResult ( e ) ;
});
/*
jsdoc -d ../doc -t ../../node_modules/ink-docstrap/template/ -c ../../node_modules/ink-docstrap/template/conf.json *.js
 */
