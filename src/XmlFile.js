var util = require ( "util" ) ;
var File = require ( 'gbase' ).File ;

/**
 * @constructor
 * @param {string} path
 * @param {string} name
 */
var XmlFile = function ( path, name )
{
  File.call ( this, path, name ) ;
};
util.inherits ( XmlFile, File ) ;
/**
 * Description
 * @param {} elementCallback
 * @return CallExpression
 */
XmlFile.prototype.getXml = function ( options )
{
	var data = this.getString() ;
	var xml = require ( './Xml' ) ;
  var f = new xml.XmlFactory ( options ) ;
  return f.create ( data ) ;
};
/**
 * Description
 * @param {} options
 * @return xmlTree
 */
XmlFile.prototype.getXmlResolved = function ( options )
{
	if ( ! options )
	{
		options = { includeTags: [ "xi:include" ] } ;
	}
	var m = [] ;
	var i ;
	if ( Array.isArray ( options.includeTags ) )
	{
		var a = options.includeTags ;
		var len = a.length ;
		for ( i = 0 ; i < len ; i++ )
		{
			m[a[i]] = true ;
		}
	}
  var includeList = [] ;
  var xmlTree = this.getXml ( { resolveFromEnvironment: true
  														, variablesMap: options.variablesMap
							  							, elementCallback: function ( x )
																{
																  if ( m[x.getName()] )
																  {
																    includeList.push ( x ) ;
																  }
																}
							  							} ) ;
	for ( var i = 0 ; i < includeList.length ; i++ )
	{
		this._getXmlResolved ( m, includeList[i], options ) ;
	}
	includeList.length = 0 ;
	return xmlTree ;
};
XmlFile.prototype._getXmlResolved = function ( includeTagNameMap, includeElement, options )
{
  var includeList = [] ;

  var href = includeElement.getAttribute ( "href" ) ;
  if ( ! href ) return ;
  var file = new XmlFile ( this.getParent(), href ) ;
  var elem = file.getXml ( { resolveFromEnvironment: true
  												 , variablesMap: options.variablesMap
							  					 , elementCallback: function ( x )
														 {
															 if ( m[x.getName()] )
															 {
																 includeList.push ( x ) ;
															 }
															}
							  						} ) ;
  includeElement.replace ( elem ) ;

	for ( var i = 0 ; i < includeList.length ; i++ )
	{
		this._getXmlResolved ( includeTagNameMap, includeList[i], options ) ;
	}
	includeList.length = 0 ;
};

module.exports = XmlFile ;

if ( require.main === module )
{
	var f = new XmlFile ( process.argv[2] ) ;
	// var x = f.getXml() ;
	var x = f.getXmlResolved({variablesMap:{"first.content":"BBBBBBBBBBBBBBBBBBBB"}}) ;
	console.log ( x.toString() ) ;
}
