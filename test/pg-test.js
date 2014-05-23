var pg = require('pg'); 
var txml = require ( 'Xml' ) ; 
var Promise = require('promise');
var T = require('Tango');
var Log = require ( "LogFile" ) ;

//or native libpq bindings
//var pg = require('pg').native

var conString = "postgres://gess:luap1997@localhost:5432/gess";

var client = new pg.Client(conString);
// client.connect(function(err) {
//   if(err) {
//     return console.error('could not connect to postgres', err);
//   }
//   client.query('SELECT NOW() AS "theTime"', function(err, result) {
//     if(err) {
//       return console.error('error running query', err);
//     }
//     console.log(result.rows[0].theTime);
//     //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
//     client.end();
//   });
// });

var tree = new txml.XmlTree() ;
var tab = tree.add ( "T_IDENTITY" ) ;
client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  client.query('SELECT i.*, t.identity_type_name from t_identity i, t_identity_type t where i.identity_type_key=t.identity_type_key', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    var n = result.rows.length ;
    for ( var i = 0 ; i < n ; i++ )
    {
      var xr = tab.add ( "row" ) ;
      var r = result.rows[i] ;
      for ( k in r )
      {
        var v = r[k] ;
        if ( v === null ) continue ;
        xr.add ( k, v ) ;
      }
    }
    // console.log(result.rows);
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
    client.end();
console.log ( tree.toString() ) ;
  });
});
return ;
var promise = new Promise(function (resolve, reject)
{
  client.connect ( function(err,res)
  {
    if ( err ) reject ( err ) ;
    else resolve ( res ) ;
  });
});
promise.then
( function success ( a )
  {
    console.log ( "1 ------------------" ) ;
    var p = new Promise ( function ( resolve, reject )
    {
      client.query ('SELECT i.*, t.identity_type_name from t_identity i, t_identity_type t where i.identity_type_key=t.identity_type_key', function(err, result)
      {
        if ( err ) reject ( err ) ;
        else resolve ( result ) ;
      }) ;
    });
    return p ;
  },
  function error ( p )
  {
    console.log ( "2 ------------------" ) ;
    console.log ( p ) ;
  }
).then
( function success ( p )
  {
    console.log ( "3 ------------------" ) ;
    // console.log ( p ) ;
  },
  function error ( p )
  {
    console.log ( "4 ------------------" ) ;
    console.log ( p ) ;
    Log.log ( p ) ;
    console.log ( p.constructor ) ;
    console.trace("XXXXXXXXXXXXXXX") ;
  }
).catch
( function ( p )
  {
    console.log ( "--------catch---------" ) ;
    console.log ( "p=" + p ) ;
    T.log ( p ) ;
  }
).done
( function done ( p )
  {
    console.log ( "--------done---------" ) ;
    console.log ( "p=" + p ) ;
    T.log ( p ) ;
    client.end();
  }
);
;
/*
client.connect(function(err,p2) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
console.log ( p2 ) ;
  client.query('SELECT i.*, t.identity_type_name from t_identity i, t_identity_type t where i.identity_type_key=t.identity_type_key', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    var n = result.rows.length ;
console.log ( "n=" + n ) ;
    for ( var i = 0 ; i < n ; i++ )
    {
      var xr = tab.add ( "row" ) ;
      var r = result.rows[i] ;
      for ( k in r )
      {
        var v = r[k] ;
        if ( v === null ) continue ;
        xr.add ( k, v ) ;
      }
    }
    // console.log(result.rows);
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
    client.end();
// console.log ( tree.toString() ) ;
  });
});
*/