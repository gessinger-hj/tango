var Uri = require ( "Uri" ) ;

var T = require ( "Tango" ) ;
var DateUtils = require ( "DateUtils" ) ;

var what = T.getProperty ( "what", "translate" ) ;
var i ;
if ( what === "translate" )
{
  var sl = T.getProperty ( "sl", "en" ) ;
  var tl = T.getProperty ( "tl", "de" ) ;
  var q  = T.getProperty ( "q", "humble" ) ;
  var uri = "http://www.google.com/translate_a/t?client=en&sl=" + sl + "&tl=" + tl + "&text=" + encodeURIComponent ( q ) ;
  var U = new Uri ( uri ) ;

  U.getJSON ( function getJSON ( err, res )
  {
    if ( err ) { console.log ( err ) ; return ; }
    var str = "" ;
    str += q + " --> " + res.sentences[0].trans ;
    if ( res.dict )
    {
      for ( var i = 0 ; i < res.dict.length ; i++ )
      {
        var item = res.dict[i] ;
        if ( item.pos )
        {
          str += "\n" + item.pos + "\n\t" ;
        }
        if ( item.terms )
        {
          var first = true ;
          for ( var j = 0 ; j < item.terms.length ; j++ )
          {
            if ( first )
            {
              first = false ;
            }
            else str += ", " ;
            str += item.terms[j] ;
          }
        }
      }
    }
    console.log ( str ) ;
  }) ;
  return ;
}
if ( what === "rss" )
{
  translateTimeOffsetOf = function ( D )
  {
    var NOW = new Date() ;
    var diff = Math.floor ( ( NOW.getTime() - D.getTime() ) / 1000 ) ;
    var daysec = 24 * 60 * 60 ;
    var days = Math.floor ( diff / daysec ) ;
    diff = diff % daysec ;
    var hours = Math.floor ( diff / ( 60 * 60 ) ) ;
    diff = diff % ( 60 * 60 ) ;
    var minutes = Math.floor ( diff / 60 ) ;
    diff = diff % 60 ;
    var seconds = Math.floor ( diff ) ;
    var str = "" ;
    if ( days ) str = "" + days + " days, " + hours + " hours and " + minutes + " minutes ago." ;
    else
    if ( hours ) str = "" + hours + " hours and " + minutes + " minutes ago." ;
    else
    if ( minutes ) str = "" + minutes + " minutes and " + seconds + " seconds ago." ;
    else
    if ( seconds ) str = "" + seconds + " seconds ago." ;
    return str ;
  } ;
  var key = T.getProperty ( "key", "zeit" ) ;
  if ( ! key )
  {
    key = "zeit" ;
  }
  var U ;
  if ( key === "zeit" )
  {
    U = new Uri ( "http://newsfeed.zeit.de/index" ) ;
  }
  U.getXml ( function getXml ( err, xml )
  {
    var isRdfOrRss = false ;
    var isAtom = false ;
    var xRdfOrRss = xml ;

    var xItemElement = null ;
    if ( xRdfOrRss.getName() == 'rss' ) 
    {
      isRdfOrRss = true ;
      xItemElement = xRdfOrRss.elem ( "channel" ) ;
    }
    else
    if ( xRdfOrRss.getName() == 'RDF' ) 
    {
      isRdfOrRss = true ;
      xItemElement = xRdfOrRss ;
    }
    else
    if ( xRdfOrRss.getName() == 'feed' ) 
    {
      isAtom = true ;
      xItemElement = xRdfOrRss ;
    }
    var str = "" ;

// console.log ( xRdfOrRss.toString() ) ;
/*
<pubDate>Sat, 09 Apr 2011 18:26:16 +0200</pubDate>
published>2011-04-05T14:07:00+02:00</published>
<updated>2011-04-05T14:41:32+02:00</updated>
*/
    if ( isRdfOrRss )
    {
      var headerTitle = xRdfOrRss.getContent ( "channel/title" ) ;
      var headerDescription = xRdfOrRss.getContent ( "channel/description" ) ;

      var children = xItemElement.children ;
      for ( i = 0 ; i < children.length ; i++ )
      {
        var xItem = children[i] ;
        if ( xItem.getName() !== "item" )
        {
          continue ;
        }
// console.log ( xItem.toString()  ) ;
        var title = xItem.getContent ( "title" ) ;
        var link = xItem.getContent ( "link" ) ;
        var description = xItem.getContent ( "description" ) ;
        var content_encoded = xItem.getContent ( "encoded" ) ;
        var pubDate = xItem.getContent ( "pubDate" ) ;
        if ( ! pubDate ) pubDate = xItem.getContent ( "updated" ) ;
        if ( ! pubDate ) pubDate = xItem.getContent ( "published" ) ;
        if ( ! pubDate ) pubDate = xItem.getContent ( "publicationDate" ) ;
        if ( ! pubDate ) pubDate = xItem.getContent ( "date" ) ;
        if ( pubDate ) pubDate = DateUtils.parseDate ( pubDate ) ;
        if ( pubDate ) pubDate = translateTimeOffsetOf ( pubDate ) ;
        if ( ! pubDate ) pubDate = "" ;
        if ( content_encoded )
        {
          description  = content_encoded ;
        }

        str += title + " (" + pubDate + ")\n"
        // str += description + "\n" ;
      }
      console.log ( str ) ;
    }
    else
    if ( isAtom )
    {
      var headerTitle = xRdfOrRss.getContent ( "title" ) ;
      var headerDescription = xRdfOrRss.getContent ( "subtitle" ) ;
      var children = xItemElement.children ;
      for ( i = 0 ; i < children.length ; i++ )
      {
        var xItem = children[i] ;
        var title = xItem.getContent ( "title" ) ;
        var link = xItem.getContent ( "id" ) ;
        var description = xItem.getContent ( "summary" ) ;
        var pubDate = xItem.getContent ( "pubDate" ) ;
        var pubDate = xItem.getContent ( "pubDate" ) ;
        if ( ! pubDate ) pubDate = xItem.getContent ( "updated" ) ;
        if ( ! pubDate ) pubDate = xItem.getContent ( "published" ) ;
        if ( ! pubDate ) pubDate = xItem.getContent ( "publicationDate" ) ;
        if ( ! pubDate ) pubDate = xItem.getContent ( "date" ) ;
        if ( pubDate ) pubDate = DateUtils.parseDate ( pubDate ) ;
        if ( pubDate ) pubDate = translateTimeOffsetOf ( pubDate ) ;
        if ( ! pubDate ) pubDate = "" ;

        str += title + " (" + pubDate + ")\n"
        // str += description + "\n" ;
      }
      console.log ( str ) ;
    }
  }) ;
}
