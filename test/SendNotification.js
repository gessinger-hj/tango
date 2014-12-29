var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var Client = require ( "./gp/Client" ) ;

var gpclient = new Client() ;

gpclient.on ( 'error', function gpclient_on_error ( e )
{
	console.log ( e ) ;
});


var text = T.getProperty ( "text", "" + new Date() ) ;
var e = new NEvent ( "notify" ) ;
e.body = { text: text } ;
gpclient.fire ( e, { error: function(e) {console.log ( e ) ; this.end() ; } , write: function() {this.end() ; } } ) ;
