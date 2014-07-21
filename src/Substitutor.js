module.exports = function(T) {
   var ItemSubstitutor = require ( "./ItemSubstitutor.js" )(T) ;
   // tangojs = require ( "tangojs" ) ;
   var splitCsv = require ( "./Utils.js" )(T).splitCsv ;
   var stream = require('stream');

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
     if ( src instanceof stream.Readable && map instanceof stream.Writable )
     {
       return this._substitute ( src, map, useEnv, delimiter, escapeApos ) ;
     }

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
   var VARIABLE_MAX_LEN = 1024 ;
   Substitutor.prototype._substitute = function ( r, w, map, useEnv, delimiter, depth )
   {
     if ( ! delimiter ) delimiter = "{" ;

     if ( map && typeof map.getText !== 'function'  )
     {
       var m = { map:map, getText: function ( key ) { return this.map[key] ; } } ;
       map = m ;
     }
     if ( useEnv !== true ) useEnv = false ;

   	var isXml = false ;
   	var j, i ;
   	var xmlTestString = "" ;

   	var count = 0 ;
     var lastWasBackSlash0 = false ;
   	var c0 = 0 ;
     var c1 = 0 ;
     var cc = 0 ;
   	var k = 0 ;
     var sb2, sb3, sb4 ;
     var pCount = 1 ;
     var found = false ;
     var lastWasBackSlash = false ;
     var name, n, v ;

     if ( delimiter == '{' )
     {
       lastWasBackSlash0 = false ;
       c0 = 0 ;
       c1 = 0 ;
       while ( true )
       {
   			j++ ;
   			if ( c0 === 0 && c1 === 0 )
   			{
           k = r.read ( 1 ) ;
   				if ( k === null ) break ;
   				c0 = k ;
           k = r.read ( 1 ) ;
   				if ( k === null )
   				{
   					w.write ( c0 ) ;
   				  break ;
   				}
   				c1 = k ;
   			}
   			else
   			if ( c1 !== 0 )
   			{
           k = r.read ( 1 ) ;
   				c0 = c1 ;
   				if ( k === null ) c1 = 0 ;
   				else              c1 = k ;
   			}
   			else
   			{
   				break ;
   			}
   			if ( j < 20 )
   			{
   				xmlTestString += c0 ;
   			}
   			if ( j == 20 )
   			{
   	      if ( xmlTestString.indexOf ( "<?xml" ) >= 0 ) isXml = true ;
   			}
         if ( c0 === '$' )
         {
           if ( lastWasBackSlash0 )
   				{
   					w.write ( c0 ) ;
             lastWasBackSlash0 = false ;
   				  continue ;
   				}
   			}
         if ( lastWasBackSlash0 )
   			{
   				w.write ( '\\' ) ;
   			}
         if ( c0 === '\\' && c1 === '$' )
         {
           lastWasBackSlash0 = true ;
   				continue ;
   			}
         lastWasBackSlash0 = false ;
         if ( c0 === '$' && c1 === '{' )
         {
           sb2 = "" ;
           sb3 = "" ;
           pCount = 1 ;
           found = false ;
           lastWasBackSlash = false ;
           for ( ; true ; )
           {
             k = r.read ( 1 ) ;
   					if ( k === null )
   					{
   					  c1 = 0 ;
   						break ;
   					}
             cc = k ;
   					sb3 += cc ;
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
               k = r.read ( 1 ) ;
   					  if ( k === null ) c1 = 0 ;
   						else              c1 = k ;
               break ;
             }
             if ( cc === '\\' ) lastWasBackSlash = true ;
   					else               sb2 += cc ;
   //	          if ( sb2.getLength() > VARIABLE_MAX_LEN ) break ;
           }
           if ( ! found )
           {
             w += "${" ;
             var sr = new StringStreamReadable ( sb3 ) ;
   	        count += _substitute ( sr, w, map, useEnv, delimiter, depth++ ) ;
             continue ;
           }

           name = sb2.toString() ;
           v = null ;
           v = this._IS.substitute ( this, name, map, useEnv, delimiter ) ;
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
   					if ( isXml )
   					{
             	if (  v.indexOf ( '<' ) >= 0
                	 || v.indexOf ( '>' ) >= 0
                	 || v.indexOf ( '&' ) >= 0
                	 || v.indexOf ( '\'' ) >= 0
                	 )
             	{
   							sb4 = "" ;
               	for ( i = 0 ; i < v.length ; i++ )
               	{
                 	c = v.charAt ( i ) ;
                 	if ( c == '<' ) sb4 += "&lt;" ;
                 	else
                 	if ( c == '>' ) sb4 += "&gt;" ;
                 	else
                 	if ( c == '&' )
   								{
   									if ( i + 2 < v.length && v.charAt ( i + 2 ) === ';' ) { sb4 += "&" ; continue ; }
   									if ( i + 3 < v.length && v.charAt ( i + 3 ) === ';' ) { sb4 += "&" ; continue ; }
   									if ( i + 4 < v.length && v.charAt ( i + 4 ) === ';' ) { sb4 += "&" ; continue ; }
   									if ( i + 5 < v.length && v.charAt ( i + 5 ) === ';' ) { sb4 += "&" ; continue ; }
   									if ( i + 6 < v.length && v.charAt ( i + 6 ) === ';' ) { sb4 += "&" ; continue ; }
   									if ( i + 7 < v.length && v.charAt ( i + 7 ) === ';' ) { sb4 += "&" ; continue ; }
   									sb4 += "&amp;" ;
   								}
                 	else
                 	if ( c === '\'' ) sb4 += "&apos;" ;
                 	else              sb4 += c ;
               	}
   							v = sb4 ;
             	}
   					}
   					count++ ;
             w.write ( v ) ;
           }
           else
           {
             w.write ( "${" ) ;
             w.write ( name ) ;
             w.write ( "}" ) ;
           }
         }
         else
         {
           w.write ( c0 ) ;
         }
       }
     }
     else
     {
       while ( true )
       {
         k = r.read ( 1 ) ;
   		  if ( k === null ) break ;
   		  c = k ;
         if ( c !== delimiter )
   			{
           w.write ( c ) ;
   				continue ;
   			}
         found = false ;
         sb2 = "" ;
         sb3 = "" ;
         for ( ; true ; )
         {
           k = r.read ( 1 ) ;
   			  if ( k === null ) break ;
   		    c = k ;
   				sb3 += c ;
   				if ( c !== delimiter )
   				{
   					sb2 += c ;
   					continue ;
   				}
           found = true ;
   				break ;
   //	        if ( sb2.getLength() > VARIABLE_MAX_LEN ) break ;
   			}
   			if ( ! found )
   			{
           w.write ( delimiter ) ;
           var sr = new StringStreamReadable ( sb3 ) ;
   	      count += _substitute ( sr, w, map, delimiter, useEnv, depth++ ) ;
   				continue ;
   			}
         n = sb2 ;
         v = null ;
         if ( map ) v = map.getText ( n ) ;
         if ( typeof v !== 'string' )
         {
           v = this._IS.substitute ( this, n, map ) ;
         }
         if ( typeof v !== 'string' && useEnv )
         {
           v = T.getProperty ( n) ;
         }
         if ( typeof v === 'string' )
         {
   				count++ ;
           w.write ( v ) ;
         }
         else
         {
           w.write ( delimiter ) ;
           w.write ( sb2 ) ;
         }
       }
     }
   	if ( depth == 0 )
   	{
   	  r.end() ;
   	  w.end() ;
   	}
     return count ;
   }

   return Substitutor ;

   if ( require.main === module )
   {
     var StringStreamReadable = require ( "StringStreamReadable" ) ;
     var StringStreamWritable = require ( "StringStreamWritable" ) ;

     //     String week = h.get ( "WEEK" ) ;
   //     String date = h.get ( "DATE" ) ;
   //     String format = h.get ( "FORMAT" ) ;

     var str = "------%NN%----%%------${N}----------${CC${cc}}---${firstTimeOfWeekOf(week=\"0\",locale=de_DE)}--" ;
     var sub = new Substitutor() ;
     var r = new StringStreamReadable ( str ) ;
     var w = new StringStreamWritable() ;
     var t = sub.substitute ( r, w, { N: "value-${N3}-", N2: "ABC", N3: "XYZ", CCC: "12345", cc:"C" } ) ;
     console.log ( w.toString() ) ;
  
     // var t = sub.substitute ( str, { N: "value-${N3}-", N2: "ABC", N3: "XYZ", CCC: "12345", cc:"C" } ) ;
     // console.log ( t ) ;
     var t = sub.substitute ( str, { NN: "XXXX" }, true, '%' ) ;
     console.log ( t ) ;
     var r = new tangojs.StringStreamReadable ( str ) ;
     var w = new tangojs.StringStreamWritable() ;
     var t = sub.substitute ( r, w, { NN: "XXXX" }, true, '%' ) ;
     console.log ( w.toString() ) ;
     // console.log ( sub.substitute ( "--${firstTimeOfMonthOf(month=0)}--" ) ) ;
     // console.log ( sub.substitute ( "--${firstTimeOfDayOf(day=0)}--" ) ) ;
     // console.log ( sub.substitute ( "--${formatDate(date=0,locale=fr_FR,type=long)}--" ) ) ;
   };

   
} ;