var request = require ( "request" ) ;
var StringWritable = require ( "./StringWritable" ) ;
var EventEmitter = require ( "events" ).EventEmitter ;
var util = require ( "util" ) ;

/**
 * @constructor
 * @param {string|object} parameter
 */
var Uri = function ( parameter )
{
  EventEmitter.call ( this ) ;
  if ( typeof parameter === 'string' )
  {
    this.uri = parameter ;
  }
  else
  {
    this.uri = parameter.uri ;
  }
};
util.inherits ( Uri, EventEmitter ) ;

Uri.prototype.toString = function()
{
  return "(" + this.jsClassName + ")[uri=" + this.uri + "]" ;
};
Uri.prototype.getString = function ( callback )
{
  return this._getString ( { emitBody: true, callback: callback } ) ;
};
Uri.prototype._getString = function ( parameter )
{
  var writable = new StringWritable() ;
  this.callback = parameter.callback ;
  var thiz = this ;
  var req = new request (
  {
    uri: this.uri
  , encoding: null
  // method: "GET",
  // timeout: 10000,
  // followRedirect: true,
  // maxRedirects: 10
  , headers:
    {
      "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)"
    , "Accept": "image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, image/png, */*"
    // , "Accept-Language": QCSys.getLanguageCode() ) ;
    , "Accept-Charset": "utf-8,iso-8859-1,*"
    }
  }, function ( error, response, body )
  {
    if ( error )
    {
      if ( thiz.callback ) thiz.callback ( error, thiz ) ;
      thiz.emit ( "error", response, error ) ;
      return ;
    }
    if ( response.statusCode !== 200 )
    {
      if ( thiz.callback ) thiz.callback ( null, response, thiz ) ;
      thiz.emit ( "error", response ) ;
      return ;
    }
  }) ;
  req.on ( "data", function request_ondata ( data )
  {
    writable.write ( data ) ;
  }) ;
  req.on ( "end", function request_onend ( e )
  {
    var body = writable.toString() ;
    if ( parameter.emitBody )
    {
      thiz.emit ( "end", body ) ;
    }
    if ( thiz.callback ) thiz.callback ( null, body, thiz ) ;
  }) ;
};
Uri.prototype.getJSON = function ( callback )
{
  return this._getString ( { emitBody: false, callback: function internalCallback ( err, body )
  {
    var o = JSON.parse ( body ) ;
    callback ( err, o ) ;
  } } ) ;
};
Uri.prototype.getXml = function ( callback )
{
  return this._getString ( { emitBody: false, callback: function internalCallback ( err, body )
  {
    var xml = require ( './Xml' ) ;
    var f = new xml.XmlFactory() ;
    var x = f.create ( body ) ;
    callback ( err, x ) ;
  } } ) ;
};
module.exports = Uri ;

if ( require.main === module )
{
  var sl = "en" ;
  var tl = "de" ;
  var q  =  "humble" ;
  var uri = "http://www.google.com/translate_a/t?client=en&sl=" + sl + "&tl=" + tl + "&text=" + encodeURIComponent ( q ) ;
  // uri = "http://www.zeit.de" ;
  var U = new Uri ( uri ) ;

  // U.getString ( function getString ( err, p )
  // {
  // if ( err ) console.log ( err ) ;
  //   console.log ( p ) ;
  // }) ;
  // U.getJSON ( function getJSON ( err, res )
  // {
  //   if ( err ) { console.log ( err ) ; return ; }
  //   console.log ( util.inspect ( res, { showHidden: false, depth: null } ) ) ;
  // }) ;
  
  U = new Uri ( "http://newsfeed.zeit.de/index" ) ;
  U.getXml ( function getJSON ( err, p )
  {
  if ( err ) console.log ( err ) ;
console.log ( p.toString() ) ;
  }) ;
  
}
