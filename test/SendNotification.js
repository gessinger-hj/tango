var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var GPClient = require ( "GPClient" ) ;

var gpclient = new GPClient() ;

gpclient.on ( 'error', function gpclient_on_error ( e )
{
	console.log ( e ) ;
});


var text = T.getProperty ( "text", "" + new Date() ) ;
var e = new NEvent ( "notify" ) ;
e.data = { text: text } ;
gpclient.fire ( e, { error: function(e) {console.log ( e ) ; this.end() ; } , write: function() {this.end() ; } } ) ;




