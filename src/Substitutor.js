T = require ( "Tango" ) ;
ItemSubstitutor = require ( "./ItemSubstitutor" ) ;
// tangojs = require ( "tangojs" ) ;
var splitCsv = require ( "Utils" ).splitCsv ;

/**
  * @constructor
  */
var Substitutor = function ( itemSubstitutor )
{
  this._IS = itemSubstitutor
  if ( ! this._IS )
  {
    this._IS = new ItemSubstitutor() ;
  }
};
Substitutor.prototype.substitute = function ( src, map, useEnv, delimiter, escapeApos )
{
  if ( ! src ) return src ;
  if ( src.length == 0 ) return src ;
  if ( ! delimiter ) delimiter = "{" ;

  if ( map && typeof map.getText !== 'function'  )
  {
    var m = { map:map, getText: function ( key ) { return this.map[key] ; } } ;
    map = m ;
  }
  if ( useEnv !== true ) useEnv = false ;

  var pos = src.indexOf ( delimiter ) ;
  if ( pos < 0 ) return src ;

  var tgt = "" ;

  var i, j, sb2, cc, c, name, n, v ;

  if ( delimiter === '{' )
  {
    for ( i = 0 ; i < src.length ; i++ )
    {
      c = src.charAt ( i ) ;
      if ( c === '$' && src.length > i && src.charAt ( i+1 ) === '{' )
      {
        sb2 = "" ;
        var pCount = 1 ;
        var found = false ;
        var lastWasBackSlash = false ;
        for ( j = i + 2 ; j < src.length ; j++ )
        {
          cc = src.charAt ( j ) ;
          if ( cc === '{' )
          {
            if ( ! lastWasBackSlash ) pCount++ ;
            lastWasBackSlash = false ;
          }
          else
          if ( cc === '}' )
          {
            if ( ! lastWasBackSlash ) pCount-- ;
            lastWasBackSlash = false ;
          }
          else
          {
            if ( lastWasBackSlash ) sb2 += "\\" ;
            lastWasBackSlash = false ;
          }
          if ( pCount === 0 )
          {
            found = true ;
            i = j ;
            break ;
          }
          sb2 += cc ;
          if ( cc === '\\' ) lastWasBackSlash = true ;
        }
        if ( ! found )
        {
          tgt += c ;
          continue ;
        }

        name = sb2 ;
        var v = this._IS.substitute ( this, name, map, useEnv, delimiter ) ;
        if ( typeof v !== 'string' && map )
        {
          v = map.getText ( name ) ;
        }
  
        if ( typeof v !== 'string' && useEnv )
        {
          v = T.getProperty ( name ) ;
        }
        if ( typeof v === 'string' )
        {
          if ( escapeApos && v.indexOf ( '\'' ) >= 0 )
          {
            for ( var iv = 0 ; iv < v.length ; iv++ )
            {
              if ( v.charAt ( iv ) == '\'' ) tgt += "&apos;" ;
              else                           tgt += v.charAt ( iv ) ;
            }
          }
          else
          {
            tgt += v ;
          }
        }
        else
        {
          tgt += "${" ;
          tgt += name ;
          tgt += "}" ;
        }
      }
      else
      {
        tgt += c ;
      }
    }
  }
  else
  {
    for ( i = 0 ; i < src.length ; i++ )
    {
      c = src.charAt ( i ) ;
      if ( c === delimiter )
      {
        j = src.indexOf ( delimiter, i+1 ) ;
        if ( j > 0 )
        {
          name = "" ;
          for ( i++ ; i < j ; i++ )
          {
            name += src.charAt ( i ) ;
          }
          n = name ;
          v = null ;
          if ( map ) v = map.getText ( n ) ;
  
          if ( typeof v !== 'string' )
          {
            v = this._IS.substitute ( this, n, map, useEnv, delimiter ) ;
          }
          if ( typeof v !== 'string' && useEnv )
          {
            v = T.getProperty ( n ) ;
          }
          if ( typeof v === 'string' )
          {
            if ( escapeApos && v.indexOf ( '\'' ) >= 0 )
            {
              for ( var iv = 0 ; iv < v.length ; iv++ )
              {
                if ( v.charAt ( iv ) == '\'' ) tgt += "&apos;" ;
                else                           tgt += v.charAt ( iv ) ;
              }
            }
            else
            {
              tgt += v ;
            }
          }
          else
          {
            tgt += delimiter ;
            tgt += name ;
            i-- ;
          }
        }
        else tgt += c ;
      }
      else
      {
        tgt += c ;
      }
    }
  }
  return tgt ;
}
module.exports = Substitutor ;

if ( require.main === module )
{
  //     String week = h.get ( "WEEK" ) ;
//     String date = h.get ( "DATE" ) ;
//     String format = h.get ( "FORMAT" ) ;

  var str = "------%NN%----%%------${N}----------${CC${cc}}---${firstTimeOfWeekOf(week=\"0\",locale=de_DE)}--" ;
  var sub = new Substitutor() ;
  var t = sub.substitute ( str, { N: "value-${N3}-", N2: "ABC", N3: "XYZ", CCC: "12345", cc:"C" } ) ;
  console.log ( t ) ;
  var t = sub.substitute ( str, { NN: "XXXX" }, true, '%' ) ;
  console.log ( t ) ;
  console.log ( sub.substitute ( "--${firstTimeOfMonthOf(month=0)}--" ) ) ;
  console.log ( sub.substitute ( "--${firstTimeOfDayOf(day=0)}--" ) ) ;
  console.log ( sub.substitute ( "--${formatDate(date=0,locale=fr_FR,type=long)}--" ) ) ;
}
// 	private int VARIABLE_MAX_LEN = 1024 ;
//   private int _substitute ( Reader r
//                           , Writer w
//                           , Map<String,String> h
//                           , char delimiter
//                           , boolean useEnv
//                           , int depth
//                           )
//   throws Exception
//   {
// 		boolean isXml = false ;
// 		int j = 0 ;
// 		StringBuilder xmlTestString = new StringBuilder() ;

// 		int count = 0 ;
//     if ( delimiter == '{' )
//     {
//       boolean lastWasBackSlash0 = false ;
// 			char c0 = 0 ;
// 			char c1 = 0 ;
//       while ( true )
//       {
// 				j++ ;
// 				if ( c0 == 0 && c1 == 0 )
// 				{
//           int k = r.read() ;
// 					if ( k == -1 ) break ;
// 					c0 = (char)(0xFFFF & k) ;
//           k = r.read() ;
// 					if ( k == -1 )
// 					{
// 						w.append ( c0 ) ;
// 					  break ;
// 					}
// 					c1 = (char)(0xFFFF & k) ;
// 				}
// 				else
// 				if ( c1 != 0 )
// 				{
//           int k = r.read() ;
// 					c0 = c1 ;
// 					if ( k == -1 ) c1 = 0 ;
// 					else           c1 = (char)(0xFFFF & k) ;
// 				}
// 				else
// 				{
// 					break ;
// 				}

// 				if ( j < 20 )
// 				{
// 					xmlTestString.append ( c0 ) ;
// 				}
// 				if ( j == 20 )
// 				{
// 		      if ( xmlTestString.toString().indexOf ( "<?xml" ) >= 0 ) isXml = true ;
// 				}
//         if ( c0 == '$' )
//         {
//           if ( lastWasBackSlash0 )
// 					{
// 						w.append ( c0 ) ;
//             lastWasBackSlash0 = false ;
// 					  continue ;
// 					}
// 				}
//         if ( lastWasBackSlash0 )
// 				{
// 					w.append ( '\\' ) ;
// 				}
//         if ( c0 == '\\' && c1 == '$' )
//         {
//           lastWasBackSlash0 = true ;
// 					continue ;
// 				}
//         lastWasBackSlash0 = false ;
//         if ( c0 == '$' && c1 == '{' )
//         {
//           StringBuilder sb2 = new StringBuilder() ;
//           StringBuilder sb3 = new StringBuilder() ;
//           int pCount = 1 ;
//           boolean found = false ;
//           boolean lastWasBackSlash = false ;
//           for ( ; true ; )
//           {
//             int k = r.read() ;
// 						if ( k == -1 )
// 						{
// 						  c1 = 0 ;
// 							break ;
// 						}
//             char cc = (char)(0xFFFF & k) ;
// 						sb3.append ( cc ) ;
//             if ( cc == '{' )
//             {
//               if ( ! lastWasBackSlash ) pCount++ ;
//               lastWasBackSlash = false ;
//             }
//             else
//             if ( cc == '}' )
//             {
//               if ( ! lastWasBackSlash ) pCount-- ;
//               lastWasBackSlash = false ;
//             }
//             else
//             {
//               if ( lastWasBackSlash ) sb2.append ( "\\" ) ;
//               lastWasBackSlash = false ;
//             }
//             if ( pCount == 0 )
//             {
//               found = true ;
//               k = r.read() ;
// 						  if ( k == -1 ) c1 = 0 ;
// 							else           c1 = (char)(0xFFFF & k) ;
//               break ;
//             }
//             if ( cc == '\\' ) lastWasBackSlash = true ;
// 						else              sb2.append ( cc ) ;
// //	          if ( sb2.getLength() > VARIABLE_MAX_LEN ) break ;
//           }
//           if ( ! found )
//           {
//             w.append ( "${" ) ;
//             StringReader sr = new StringReader ( sb3.toString() ) ;
// 		        count += _substitute ( sr, w, h, delimiter, useEnv, depth++ ) ;
//             continue ;
//           }

//           String name = sb2.toString() ;
//           String v = null ;
//           v = _IS.substitute ( this, name, h ) ;
//           if ( v == null && h != null )
//           {
//             v = h.get ( name ) ;
//           }
  
//           if ( v == null && useEnv )
//           {
//             v = QCSys.getProperty ( name ) ;
//           }
//           if ( v != null )
//           {
// 						if ( isXml )
// 						{
//             	if (  v.indexOf ( '<' ) >= 0
//                	 || v.indexOf ( '>' ) >= 0
//                	 || v.indexOf ( '&' ) >= 0
//                	 || v.indexOf ( '\'' ) >= 0
//                	 )
//             	{
// 								StringBuilder sb4 = new StringBuilder() ;
//               	for ( int i = 0 ; i < v.length() ; i++ )
//               	{
//                 	char c = v.charAt ( i ) ;
//                 	if ( c == '<' ) sb4.append ( "&lt;" ) ;
//                 	else
//                 	if ( c == '>' ) sb4.append ( "&gt;" ) ;
//                 	else
//                 	if ( c == '&' )
// 									{
// 										if ( i + 2 < v.length() && v.charAt ( i + 2 ) == ';' ) { sb4.append ( "&" ) ; continue ; }
// 										if ( i + 3 < v.length() && v.charAt ( i + 3 ) == ';' ) { sb4.append ( "&" ) ; continue ; }
// 										if ( i + 4 < v.length() && v.charAt ( i + 4 ) == ';' ) { sb4.append ( "&" ) ; continue ; }
// 										if ( i + 5 < v.length() && v.charAt ( i + 5 ) == ';' ) { sb4.append ( "&" ) ; continue ; }
// 										if ( i + 6 < v.length() && v.charAt ( i + 6 ) == ';' ) { sb4.append ( "&" ) ; continue ; }
// 										if ( i + 7 < v.length() && v.charAt ( i + 7 ) == ';' ) { sb4.append ( "&" ) ; continue ; }
// 										sb4.append ( "&amp;" ) ;
// 									}
//                 	else
//                 	if ( c == '\'' ) sb4.append ( "&apos;" ) ;
//                 	else             sb4.append ( c ) ;
//               	}
// 								v = sb4.toString() ;
//             	}
// 						}
// 						count++ ;
//             w.append ( v ) ;
//           }
//           else
//           {
//             w.append ( "${" ) ;
//             w.append ( name ) ;
//             w.append ( "}" ) ;
//           }
//         }
//         else
//         {
//           w.append ( c0 ) ;
//         }
//       }
//     }
//     else
//     {
//       while ( true )
//       {
//         int k = r.read() ;
// 			  if ( k == -1 ) break ;
// 			  char c = (char)(0xFFFF & k) ;
//         if ( c != delimiter )
// 				{
//           w.append ( c ) ;
// 					continue ;
// 				}
//         boolean found = false ;
//         StringBuilder sb2 = new StringBuilder() ;
//         StringBuilder sb3 = new StringBuilder() ;
//         for ( ; true ; )
//         {
//           k = r.read() ;
// 				  if ( k == -1 ) break ;
// 			    c = (char)(0xFFFF & k) ;
// 					sb3.append ( c ) ;
// 					if ( c != delimiter )
// 					{
// 						sb2.append ( c ) ;
// 						continue ;
// 					}
//           found = true ;
// 					break ;
// //	        if ( sb2.getLength() > VARIABLE_MAX_LEN ) break ;
// 				}
// 				if ( ! found )
// 				{
//           w.append ( delimiter ) ;
//           StringReader sr = new StringReader ( sb3.toString() ) ;
// 		      count += _substitute ( sr, w, h, delimiter, useEnv, depth++ ) ;
// 					continue ;
// 				}
//         String n = sb2.toString() ;
//         String v = null ;
//         if ( h != null ) v = h.get ( n ) ;
  
//         if ( v == null )
//         {
//           v = _IS.substitute ( this, n, h ) ;
//         }
//         if ( v == null && useEnv )
//         {
//           v = QCSys.getProperty ( n ) ;
//         }
//         if ( v != null )
//         {
// 					count++ ;
//           w.append ( v ) ;
//         }
//         else
//         {
//           w.append ( delimiter ) ;
//           w.append ( sb2 ) ;
//         }
//       }
//     }
// 		if ( depth == 0 )
// 		{
// 		  QCUtil.close ( r ) ;
// 		  QCUtil.close ( w ) ;
// 		}
//     return count ;
//   }
// }
