var T = require ( "Tango" ) ;
var Log = require ( "LogFile" ) ;
var File = require ( "File" ) ;
var Admin = require ( "gp/Admin" ) ;
var what = T.getProperty ( "getWatchResourceList" ) ;
var GPNotificationBroker = require ( "./GPNotificationBroker" ) ;

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

new Admin().isRunning ( function admin_is_running ( state )
{
	if ( state )
	{
		console.log ( "Already running" ) ;
		return ;
	}
	execute() ;
});

function execute()
{
	var WebSocketEventProxy = require ( "gp/WebSocketEventProxy" ) ;
	var Broker = require ( "gp/Broker" ) ;

	var s = T.getProperty ( "GEPARD_LOG" ) ;
	var GEPARD_LOG ;
	if ( s )
	{
		GEPARD_LOG = new File ( s ) ;
	}
	else
	{
		var fs = require ( "fs" ) ;
		var GEPARD_LOG = new File ( T.resolve ( "%HOME%/log" ) ) ;
		T.setProperty ( "GEPARD_LOG", GEPARD_LOG.toString() ) ;
	}
	if ( ! GEPARD_LOG.isDirectory() )
	{
		GEPARD_LOG.mkdir() ;
	}

	Log.init ( "level=info,Xedirect=3,file=%GEPARD_LOG%/%APPNAME%.log:max=1m:v=4") ;

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
	}
	RS.client.on ( "getWatchResourceList", function ( e )
	{
		e.body.watchList = watchList ;
	  this.sendResult ( e ) ;
	});
}
/*
jsdoc -d ../doc -t ../../node_modules/ink-docstrap/template/ -c ../../node_modules/ink-docstrap/template/conf.json *.js
 */
