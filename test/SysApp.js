var T = require ( "Tango" ) ;
var Log = require ( "LogFile" ) ;
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

/*
jsdoc -d ../doc -t ../../node_modules/ink-docstrap/template/ -c ../../node_modules/ink-docstrap/template/conf.json *.js
 */
RS.addChange ( new DirectoryResource ( "/home/gess/work/poi-3.8/de/devoteam/vge/acs" ) ) ;
RS.addChange ( new DirectoryResource ( "/home/gess/work/poi-3.8/acs/customer/ACS52" ) ) ;
RS.addChange ( new DirectoryResource ( "/home/gess/work/dev" ) ) ;
RS.addChange ( new DirectoryResource ( "/home/gess/work/Projects/tangojs/src" ) ) ;
RS.addChange ( new DirectoryResource ( "/home/gess/acronyl/test/private/conf" ) ) ;
RS.addChange ( new DirectoryResource ( "/home/gess/work/Repos/VGE_AWTK/private/conf/" ) ) ;
RS.addChange ( new DirectoryResource ( "/home/gess/acronyl/test/public/apps/vgecb/axl" ) ) ;
RS.addChange ( new DirectoryResource ( "/home/gess/acronyl/test/public/apps/vgecb/js" ) ) ;
RS.addChange ( new DirectoryResource ( "/home/gess/acronyl/test/public/js" ) ) ;
