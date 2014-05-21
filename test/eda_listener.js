var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var Client = require ( "Client" ) ;

var c = new Client() ;
c.addEventListener ( "send-mail", function(e)
{
  console.log ( "-------------c.addEventListener send-mail-------------------" ) ;
  T.log ( e ) ;
});
// c.addEventListener ( [ "send-mail", "alarm" ], function(e)
var falarm = function(e)
{
  console.log ( "-------------c.addEventListener alarm-------------------" ) ;
  T.log ( e ) ;
	c.sendResult ( e ) ;
} ;
c.addEventListener ( "alarm", falarm ) ;

// c.addEventListener ( "alarm", function(e)
// {
//   console.log ( "-------------c.addEventListener alarm-------------------" ) ;
//   T.log ( e ) ;
//   e.setIsResult() ;
// });
c.on('end', function()
{
  console.log('socket disconnected');
});

// T.lwhere ( "before" ) ;
// setTimeout ( function ontimeout1()
// {
// 	T.lwhere ( "function called" ) ;
// 	c.removeEventListener ( falarm ) ;
// 	// c.removeEventListener ( "send-mail" ) ; //[ "send-mail", "alarm" ] ) ;
// }, 5000 ) ;
// T.lwhere ( "after" ) ;
// setTimeout ( function ontimeout2()
// {
// 	T.lwhere ( "function called" ) ;
// 	c.end() ;
// }, 20000 ) ;