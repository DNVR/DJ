/*!
* DJ
* Copyright 2015 DNVR
*/

(function ( window, document, undefined ) {
  'use strict'

  // Common strings
  var asterisk = '*'
  var emptyString = ''

  // Common internal checker functions
  var isUndefined, isNull

  /*
  * ==================================================
  * Creation of helper DOM objects
  * --------------------------------------------------
  * Gets interfaces of HTMLElement, NodeList and HTMLCollection.
  * ==================================================
  */
  var fakeElement = document.createElement( 'nav' )
  var HTMLElement = fakeElement.constructor
  var NodeList = fakeElement.querySelectorAll( asterisk ).constructor
  var HTMLCollection = fakeElement.getElementsByTagName( 'nav' ).constructor
  /*
  * --------------------------------------------------
  * End of DOM helpers
  * --------------------------------------------------
  */


  /*
  * ==================================================
  * Types collection
  * --------------------------------------------------
  * This object contains all the essential types.
  * ==================================================
  */
  var Types = {
    Boolean : (false).constructor,
    Number : (0).constructor,
    String : emptyString.constructor,
    Array : [].constructor,
    Function : emptyString.constructor.constructor,
    Object : ({}).constructor,
    RegExp : /0/.constructor
  }

  var Object = Types.Object
  var Array = Types.Array

  /*
  * --------------------------------------------------
  * End of Types
  * --------------------------------------------------
  */


  /*
  * ==================================================
  * Common functions
  * --------------------------------------------------
  * Used to avoid repetitions
  * ==================================================
  */
  var getOwnPropertyNames = Object.getOwnPropertyNames
  var freeze = Object.freeze

  var checkIfInstanceOf = function ( val, struct ) {
    return struct.constructor === Array ? struct.some( function ( entry ) { return checkIfInstanceOf( val, entry ) } ) : val instanceof struct
  }

  var camelCase = (function () {
    var hyphenCase = /-([a-z])/g
    var camelCase = function ( str, first ) {
      return first.toUpperCase()
    }
    return function ( str ) {
      return str.replace( hyphenCase, camelCase )
    }
  })()

  var hyphenCase = (function () {
    var camelCase = /([A-Z])/g
    var hyphenCase = function ( str ) {
      return '-' + str.toLowerCase()
    }
    return function ( str ) {
      return str.replace( camelCase, hyphenCase )
    }
  })()

  var setProp = function ( prop, val ) {
    Object.defineProperty( this, prop, {
      get: function () {
        return val
      }
    })
  }

  var internalMethods = {}

  'push|pop|forEach|slice|indexOf|splice|shift|unshift|map'.split('|').forEach( function ( entry ) {
    internalMethods[entry] = Array.prototype[entry]
  })

  /*
  * --------------------------------------------------
  * End of common functions
  * --------------------------------------------------
  */


  /*
  * ==================================================
  * DataStore
  * --------------------------------------------------
  * This is used to store arbitrary data with arbitrary keys
  * ==================================================
  */
  var DataStore = (function () {

    var cache = 'cache'
    var position = 'position'

    function DataStore () {
      setProp.call( this, cache, [] )
    }

    DataStore.prototype.position = function ( ref, key ) {
      var current = -1

      this.cache.some( function ( entry, index ) {
        return ( entry.asset === ref && entry.key === key ) ? ( current = index, true ) : false
      })

      return current
    }

    DataStore.prototype.read = function ( ref, keystring ) {
      var current = this.cache[ this.position(ref, keystring) ]
      return current && current.data
    }

    DataStore.prototype.add = function ( ref, keystring, entry ) {
      var current = this.cache[ this.position(ref, keystring) ]

      if ( current ) {
        current.data = entry
      }
      else {
        this.cache.push({
          asset: ref,
          key: keystring,
          data: entry
        })
      }
    }

    DataStore.prototype.remove = function ( ref, keystring ) {
      var current = this.position( ref, keystring )
      if ( ( current + 1 ) ) {
        this.cache.splice( current, 1 )
        return true
      }
      return false
    }

    return DataStore

  })()
  /*
  * --------------------------------------------------
  * End of DataStore
  * --------------------------------------------------
  */

  var DataSet = new DataStore()

  var Data = function ( object, key, entry ) {
    if ( isNull( key ) || isUndefined( key ) || ! DJ.isObject( object ) ) return
    if ( isUndefined( entry ) ) {
      if ( arguments.length === 2 ) {
        return DataSet.read( object, key )
      }
      else {
        DataSet.remove( object, key )
      }
    }
    else {
      DataSet.add( object, key, entry )
    }
  }

  var Extend = function () {
    var target
    var temp
    var args = arguments
    var index = 0
    var count = args.length

    target = count === 1 ? this : ( index++, args[0] )

    for ( ; index < count; index++ ) {
      if ( DJ.isObject( temp = args[ index ] ) ) {
        getOwnPropertyNames( temp ).forEach( function ( entry ) {
          target[ entry ] = temp[ entry ]
        })
      }
    }

    return target
  }

  // Defining the DJ class and its essential methods
  function DJ ( selector ) {
    return new initialise( selector )
  }

  Types.DJ = DJ

  DJ.Enums = {}

  DJ.Discovered = {}

  DJ.Data = Data

  DJ.Extend = Extend

  DJ.Types = Types

  DJ.Proxy = function ( fnctn, proxyThis ) {
    var args = internalMethods.slice.call( arguments, 2 );
    var functn = function () {
      fnctn.apply( proxyThis || this, args.concat( internalMethods.slice.call( arguments ) ) );
    }
    return functn;
  }

  // Done only to make the DJ object look like an array in Chrome and Safari
  DJ.prototype.splice = internalMethods.splice


  /*
  * ==================================================
  * Type checker functions
  * --------------------------------------------------
  * This is used to store arbitrary data with arbitrary keys.
  * Available methods are DJ.isUndefined, DJ.isNull, DJ.isObject, DJ.isFunction, DJ.isString, DJ.isNumber, DJ.isArray, DJ.isBoolean, DJ.isRegExp and DJ.isDJ
  * ==================================================
  */
  isUndefined = DJ.isUndefined = function ( val ) {
    return val === undefined
  }
  isNull = DJ.isNull = function ( val ) {
    return val === null
  }
  getOwnPropertyNames( Types ).forEach( function ( entry ) {
    DJ['is' + entry] = function ( val ) {
      return ( ! ( isNull( val ) || isUndefined( val ) ) ) && ( checkIfInstanceOf( val, Types[entry] ) || val.constructor === Types[entry] )
    }
  })
  freeze( Types )

  // The constructor for a DJ object. Accepts CSS selector, HTMLElement, HTMLCollection and NodeList.
  var initialise = function ( selector ) {
    var me = this
    var sel = selector

    if ( checkIfInstanceOf( selector, DJ ) ) {
      return selector
    }
    else if ( checkIfInstanceOf( selector, HTMLElement ) ) {
      internalMethods.push.call( this, selector )
    }
    else {
      internalMethods.push.call( this, fakeElement )
      internalMethods.pop.call( this )
      try {
        selector = document.querySelectorAll( selector )
        this.selector = sel
      }
      catch (e) {
      }
      finally {
        internalMethods.forEach.call( selector, function ( entry ) {
          internalMethods.push.call( me, entry )
        })
      }
    }
  }
  initialise.prototype = DJ.prototype

  // Primary method for performing DOM object manipulation on every element in a DJ collection. Always returns a DJ object
  DJ.prototype.each = function ( fn ) {
    internalMethods.forEach.call( this, function ( entry ) {
      fn.call( entry )
    })

    return this
  }


  /*
  * ==================================================
  * DJ internal methods
  * --------------------------------------------------
  * These functions are not exposed to the public scope.
  * ==================================================
  */
  internalMethods.add = function ( entry ) {
    if ( internalMethods.indexOf.call( this, entry ) < 0 ) {
      internalMethods.push.call( this, entry )
    }
  }
  internalMethods.unique = function () {
    var i = this.length
    while ( i-- ) {
      if ( i !== internalMethods.indexOf.call( this, this[i] ) ) {
        internalMethods.splice.call( this, i, 1 )
      }
    }
  }
  internalMethods.forEachReverse = function ( fn, thisArg ) {
    var k = this.length
    while ( k-- ) {
      fn.call( thisArg, this[k], k, this )
    }
  }

  // Refreshes any DJ object with elements that match the selector if the selector was used to initialise the DJ object. Otherwise has no effect.
  DJ.prototype.refresh = function () {
    var me = this

    if ( DJ.isString( me.selector ) ) {
      while ( me.length ) {
        internalMethods.pop.call( me )
      }
      internalMethods.forEach.call( document.querySelectorAll( me.selector ), function ( entry ) {
        internalMethods.push.call( me, entry )
      })
    }

    return this
  }

  // Returns an HTMLElement at index. Not chainable.
  // Array notation can be used instead but elements with negative indices will not be accessible that way.
  DJ.prototype.element = function ( val ) {
    var length = this.length

    if ( ! length ) return this

    val = ( val | 0 ) % length
    if ( val < 0 ) val = length - val

    return this[val]
  }

  // Returns the element at a certain index as a DJ object. Reversible.
  DJ.prototype.index = function ( val ) {
    var newDJ = new initialise( this.element( val ) )
    newDJ.original = this
    return newDJ
  }

  // Returns the first element in the DJ collection as a DJ object. Reversible.
  DJ.prototype.first = function () {
    return this.index( 0 )
  }

  // Returns the last element in the DJ collection as a DJ object. Reversible.
  DJ.prototype.last = function () {
    return this.index( -1 )
  }

  // Returns the previous DJ object
  DJ.prototype.back = function () {
    return this.original || this
  }

  // Creates new DJ object that contains all elements of the existing DJ object. Reversible.
  DJ.prototype.add = function ( selector ) {
    var newDJ = new initialise( selector )

    newDJ.original = this

    internalMethods.unshift.apply( newDJ, this )

    internalMethods.unique.call( newDJ )

    return newDJ
  }

  // Returns a new DJ object that contains only elements of the original that match the selector. Reversible.
  DJ.prototype.filter = function ( selector, out ) {
    var newDJ = new initialise()

    newDJ.original = this

    this.each( function () {
      if ( out ^ this.matches( selector ) ) {
        internalMethods.add.call( newDJ, this )
      }
    })

    return newDJ
  }

  // Returns a new DJ object that contains only elements of the original that do not match the selector. Reversible.
  DJ.prototype.not = function ( selector ) {
    return this.filter( selector, true )
  }

  // Returns a new DJ object containing descendants of elements in the original that match the selector. Reversible.
  DJ.prototype.find = function ( selector ) {
    var newDJ = new initialise()

    newDJ.original = this

    try {
      if ( DJ.isString( selector ) ) {
        this.each( function () {
          internalMethods.forEach.call( this.querySelectorAll( selector ), function ( entry ) {
            internalMethods.add.call( newDJ, entry )
          })
        })
      }
    }
    catch ( e ) {
    }
    finally {
      return newDJ
    }
  }

  // Returns a new DJ object that contains the children elements of the orignal optionally that match a selector. Reversible.
  DJ.prototype.children = function ( selector ) {
    var newDJ = new initialise()

    newDJ.original = this

    selector = selector || asterisk

    this.each( function () {
      internalMethods.forEach.call( this.children, function ( entry ) {
        if ( entry.matches( selector ) ) {
          internalMethods.add.call( newDJ, entry )
        }
      })
    })

    return newDJ
  }

  // Returns a new DJ object that contains the parent elements of all elements of the original optionally those that match the selector. Reversible.
  DJ.prototype.parent = function ( selector ) {
    var newDJ = new initialise()

    newDJ.original = this

    selector = selector || asterisk

    this.each( function () {
      if ( this.parentNode !== document ) {
        internalMethods.add.call( newDJ, this.parentNode )
      }
    })

    return newDJ
  }

  // Returns a new DJ object that contains the ancestor elements of all elements of the original optionally those that match a selector. Reversible.
  DJ.prototype.ancestors = function ( selector ) {
    var newDJ = new initialise()

    newDJ.original = this

    selector = selector || asterisk

    this.each( function () {
      var temp = this
      while ( temp = temp.parentNode, temp !== document ) {
        if ( temp.matches( selector ) ) {
          internalMethods.add.call( newDJ, temp )
        }
      }
    })

    return newDJ
  }

  // Returns a new DJ object that contains the closest ancestor that matches the selector. Is equivalent to .parent() if no selector is mentioned. Reversible.
  DJ.prototype.closest = function ( selector ) {
    var newDJ = new initialise()

    newDJ.original = this

    selector = selector || asterisk

    this.each( function () {
      var temp = this
      while ( temp !== document ) {
        if ( temp.matches( selector ) ) {
          internalMethods.add.call( newDJ, temp )
          return
        }
        temp = temp.parentNode
      }
    })

    return newDJ
  }

  // Returns an array containing a one to one corresponding output of whatever function is passed as a parameter.
  // To that function, 'this' is the current HTMLElement. Not chainable.
  DJ.prototype.map = function ( fn ) {
    return internalMethods.map.call( this, fn )
  }

  // Returns an array of DJ objects for each element in the DJ collection. Not chainable.
  DJ.prototype.explode = function () {
    return this.map( function ( entry ) {
      return new initialise( entry )
    })
  }

  // Returns the bounding client rectangle object for the first element in the DJ collection. Not chainable.
  DJ.prototype.view = function () {
    return this.element( 0 ).getBoundingClientRect()
  }

  // Returns the position of the object in relation to the page. Not chainable.
  // .top and .bottom are with respect to top of the page.
  // .left and .right are with respect to the left of the page.
  DJ.prototype.position = function () {
    var boundingClientRect = this.view()
    var position = {}

    position.top = boundingClientRect.top + window.pageYOffset
    position.left = boundingClientRect.left + window.pageXOffset
    position.bottom = boundingClientRect.bottom + window.pageYOffset
    position.right = boundingClientRect.right + window.pageXOffset

    return position
  }

  // Sets width or height of every HTMLElement in the DJ collection if value is provided. If not, returns the width or height of first element.
  internalMethods.forEach.call( [ 'width', 'height' ], function ( entry ) {
    DJ.prototype[entry] = function ( value ) {
      if ( isUndefined( value ) ) {
        return this.view()[entry]
      }
      else {
        return this.each( function () {
          this.style[entry] = value == parseInt( value ) ? + value + 'px' : value
        })
      }
    }
  })

  // Returns attribute value if attribute name is specified. Not chainable.
  // Sets attribute value for each element if value is speficied and returns DJ object. Chainable.
  // Removes attributes of each element if value is explicitly set to undefined. Chainable.
  DJ.prototype.attr = function ( attr, value ) {
    if ( isUndefined( value ) ) {
      if( arguments.length < 2 ) {
        return this.element( 0 ).getAttribute( attr )
      }
      else {
        return this.each( function () {
          this.removeAttribute( attr )
        })
      }
    }
    else {
      return this.each( function () {
        this.setAttribute( attr, value )
      })
    }
  }

  // Returns aria attribute value if aria attribute name is specified. Not chainable.
  // Sets aria attribute value for each element if value is speficied and returns DJ object. Chainable.
  // Removes aria attribute of each element if value is explicitly set to undefined. Chainable.
  DJ.prototype.aria = function ( attr, value ) {
    if ( isUndefined( value ) ) {
      if( arguments.length < 2 ) {
        return this.element( 0 ).getAttribute( 'aria-' + attr )
      }
      else {
        return this.each( function () {
          this.removeAttribute( 'aria-' + attr )
        })
      }
    }
    else {
      return this.each( function () {
        this.setAttribute( 'aria-' + attr, value )
      })
    }
  }

  // Returns live dataset of first element if attribute name is not specified. Not chainable.
  // Returns dataset attribute value if attribute name is specified. Not chainable.
  // Sets dataset attribute value for each element if value is speficied and returns DJ object. Chainable.
  // Removes dataset attributes of each element if value is explicitly set to undefined. Chainable.
  DJ.prototype.data = function ( attr, value ) {
    switch ( arguments.length ) {
      case 0:
      return this.element( 0 ).dataset;
      case 1:
      return this.element( 0 ).dataset[ camelCase( attr ) ]
      default:
      if ( isUndefined( value ) ) {
        return this.each( function () {
          this.removeAttribute( 'data-' + hyphenCase( attr ) )
        })
      }
      else {
        return this.each( function () {
          this.dataset[ camelCase( attr ) ] = value
        })
      }
    }
  }

  // Returns values of first element if value is not mentioned. Not chainable.
  // Sets value of the element if value is mentioned. Chainable.
  DJ.prototype.value = function ( val ) {
    if ( isUndefined( val ) ) {
      return this.element( 0 ).value
    }
    else {
      return this.each( function () {
        if ( value in this ) {
          this.value = val
        }
      })
    }
  }

  /*
  * ==================================================
  * Content manipulation
  * --------------------------------------------------
  * Used to manipulate DOM.
  * It can be accessed directly on an DJ instance.
  * ==================================================
  */

  // Alters the textContent of each element in a DJ object. Chainable.
  // Returns the textContent of the first element if no parameter is passed. Not chainable.
  DJ.prototype.text = function ( str ) {
    if ( DJ.isString( str ) ) {
      return this.each( function () {
        this.textContent = str
      })
    }
    else {
      return this.element(0).textContent
    }
  }

  // Alters the HTML content of each element in a DJ object. Chainable.
  // Returns the HTML content of the first element if no parameter is passed. Not chainable.
  DJ.prototype.html = function ( str ) {
    if ( DJ.isString( str ) ) {
      return this.each( function () {
        this.innerHTML = str
      })
    }
    else {
      return this.element(0).innerHTML
    }
  }

  // For internal use only. Synthesises elements from HTML marked up string, NodeList, HTMLCollection and HTMLElement.
  internalMethods.synthElements = function ( content ) {
    if ( DJ.isString( content ) ) {
      fakeElement.innerHTML = content
    }
    else if ( checkIfInstanceOf( content, HTMLElement ) ) {
      fakeElement.appendChild( content.cloneNode( true ) )
    }
    else if ( checkIfInstanceOf( content, [ HTMLCollection, NodeList, DJ ] ) ) {
      internalMethods.forEach.call( content, function ( entry ) {
        fakeElement.appendChild( entry.cloneNode( true ) )
      })
    }
    var out = new initialise( fakeElement.childNodes )

    internalMethods.forEachReverse.call( fakeElement.childNodes, function ( entry ) {
      fakeElement.removeChild( entry )
    })

    return out
  }

  // Clears any and all markup within each element. Chainable.
  DJ.prototype.empty = function () {
    this.each( function () {
      var me = this
      internalMethods.forEachReverse.call( this.childNodes, function ( entry ) {
        me.removeChild( entry )
      })
    })
    return this
  }

  // Adds markup to each element.
  DJ.prototype.content = function ( content ) {
    if ( undefined === content || null === content ) {
      return this.element( 0 ).cloneNode( true ).childNodes
    }
    else if ( true === content ) {
      return new initialise( this.element( 0 ).cloneNode( true ).childNodes )
    }
    else {
      var fakeDJ = internalMethods.synthElements( content )
      this.empty().each( function () {
        var me = this
        fakeDJ.each( function () {
          me.appendChild( this.cloneNode( true ) )
        })
      })
    }
    return this
  }

  // Adds synthesised stuff to the beginning of each element.
  DJ.prototype.prepend = function ( content ) {
    var fakeDJ = internalMethods.synthElements( content )

    this.each( function () {
      var me = this
      internalMethods.forEachReverse.call( fakeDJ, function ( entry ) {
        me.insertBefore( entry.cloneNode( true ), me.firstChild )
      })
    })

    return this
  }

  // Adds synthesised stuff to the end of each element.
  DJ.prototype.append = function ( content ) {
    var fakeDJ = internalMethods.synthElements( content )

    this.each( function () {
      var me = this
      internalMethods.forEach.call( fakeDJ, function ( entry ) {
        me.appendChild( entry.cloneNode( true ) )
      })
    })

    return this
  }

  // Adds synthesised stuff before each element.
  DJ.prototype.before = function ( content ) {
    var fakeDJ = internalMethods.synthElements( content )

    this.each( function () {
      var me = this

      internalMethods.forEach.call( fakeDJ, function ( entry ) {
        me.parentNode.insertBefore( entry.cloneNode( true ), me )
      })
    })

    return true
  }

  // Adds synthesised stuff after each element.
  DJ.prototype.after = function ( content ) {
    var fakeDJ = internalMethods.synthElements( content )

    this.each( function () {
      var me = this

      internalMethods.forEachReverse.call( fakeDJ, function ( entry ) {
        if ( me.nextSibling === null ) {
          me.parentNode.appendChild( entry )
        }
        else {
          me.parentNode.insertBefore( entry.cloneNode( true ), me.nextSibling )
        }
      })
    })

    return this
  }

  /*
  * --------------------------------------------------
  * End of content manipulation
  * --------------------------------------------------
  */



  /*
  * ==================================================
  * Event handlers
  * --------------------------------------------------
  * Used to add listeners to every matched element.
  * It can be accessed directly on an DJ instance.
  *
  * The .attach() method is capable of event delegation and returning the delegating function through the release flag.
  * ==================================================
  */
  var CustomEvent = window.CustomEvent
  var Event = window.Event

  var stopPropagation = CustomEvent.prototype.stopPropagation

  CustomEvent.prototype.stopPropagation = function () {
    this.cancelBubble = true
    stopPropagation.call( this )
  }

  // Triggers a custom event based on the message passed. Accepts a message string or an event object. Bubbles. Chainable.
  DJ.prototype.trigger = function ( message, detail, params ) {
    if ( DJ.isObject( params ) ) params.detail = detail
    message = checkIfInstanceOf( message, Event ) ? message : new CustomEvent( message, params || { bubbles: true, detail: detail } )
    return this.each( function () {
      this.dispatchEvent( message )
    })
  }

  // Triggers event at an element without bubbling. Chainable.
  DJ.prototype.whisper = function ( message ) {
    return this.trigger( message, {} )
  }

  // Attaches event handlers to elements in the DJ collection. If selector is mentioned, delegates the event. Chainable.
  // If release is set to true, it returns a reference to the delegated function. Not chainable.
  DJ.prototype.attach = function ( message, fn, selector, release ) {
    var fnx = DJ.isString( selector ) ? function ( eventObject ) {
      var target = eventObject.srcElement || eventObject.target

      while ( ! eventObject.cancelBubble && target !== this ) {
        if ( target.matches( selector ) ) {
          fn.call( target, eventObject )
        }
        target = target.parentNode
      }
    } : fn

    this.each( function () {
      this.addEventListener( message, fnx )
    })

    if ( release ) {
      return fnx
    }
    else {
      return this
    }
  }

  // Removes event listener off all elements in the DJ collection. Chainable.
  DJ.prototype.detach = function ( message, fn ) {
    return this.each( function () {
      this.removeEventListener( message, fn )
    })
  }

  // Attaches event with functions that run only once after the event is triggered. Chainable.
  DJ.prototype.attachOnce = function ( message, fn, selector ) {
    var me = this
    var fnx = function ( eventObject ) {
      ( new initialise( me ) ).detach( message, fny )
      fn.call( this, eventObject )
    }
    var fny = DJ.isString( selector ) ? this.attach( message, fnx, selector, true ) : fnx
    return fny === fnx ? this.attach( message, fnx, selector ) : this
  }

  // Attaches functions to events that run only if triggered on the element and not its descendants. Chainable.
  DJ.prototype.attachNarrow = function ( message, fn, release ) {
    var fnx = function ( eventObject ) {
      if ( ( eventObject.srcElement || eventObject.target ) === this ) {
        fn.call( this, eventObject );
      }
    }
    this.each( function () {
      this.addEventListener( message, fnx );
    })

    return release ? fnx : this
  }

  // Creates shorthand methods for common events that use attach internally with the first parameter as the name of the method. Chainable.
  // Not passing a function as a parameter will trigger the event. Chainable.
  internalMethods.forEach.call( 'click|dblclick|mouseover|mouseout|keydown|keypress|keyup'.split('|'), function ( entry ) {
    DJ.prototype[entry] = function ( fn, selector, once ) {
      if ( ! DJ.isFunction( fn ) ) {
        return this.trigger( entry )
      }
      else if ( once ) {
        return this.attachOnce( entry, fn, selector )
      }
      else if ( selector === false ) {
        return this.attachNarrow( entry, fn )
      }
      else {
        return this.attach( entry, fn, selector )
      }
    }
  })

  // Special case event handler. Chainable.
  DJ.prototype.hover = function ( fnOver, fnOut ) {
    return this.mouseover( fnOver ).mouseout( fnOut || fnOver )
  }

  /*
  * --------------------------------------------------
  * End of events
  * --------------------------------------------------
  */



  /*
  * ==================================================
  * Special events for window and document
  * --------------------------------------------------
  * Used to add listeners to scroll and resize events of window.
  * It can be accessed directly on the DJ object.
  *
  * The DOMContentLoaded event can be listened to through .load() on the DJ object.
  * It has a fallback in case the DOM content is alread loaded.
  * ==================================================
  */

  // Attaches functions to the scroll and resize events of the window object. These events cannot be triggered by simply calling the function without arguments.
  internalMethods.forEach.call( [ 'scroll', 'resize' ], function ( entry ) {
    DJ[entry] = function ( fn ) {
      window.addEventListener( entry, fn )
    }
  })

  // Attaches function to the DOMContentLoaded event of the document.
  DJ.load = function ( fn ) {
    document.readyState === 'complete' ? fn.call( null ) : document.addEventListener( 'DOMContentLoaded', fn )
  }

  /*
  * --------------------------------------------------
  * End of special events
  * --------------------------------------------------
  */



  /*
  * ==================================================
  * Appearance alterations
  * --------------------------------------------------
  * Used to adjust styles and appearance attributes.
  * Shims non standard behaviours of DOMTokenList
  * ==================================================
  */

  var contains = 'contains'

  var getComputedStyle = window.getComputedStyle

  var Style = {}

  var allStyles = getOwnPropertyNames( fakeElement.style )

  var vendorCheck = ( internalMethods.slice.call( getComputedStyle( document.documentElement ) ).join(emptyString).match(/-(webkit|moz|ms)-/) || [ emptyString, emptyString ] )[1]

  setProp.call( DJ.Discovered, 'Vendor', vendorCheck )

  var vendorRegex = new Types.RegExp( '^' + vendorCheck + '([A-Z])' )

  var newStyleAttribute = function ( full, first ) {
    return first.toLowerCase()
  }

  internalMethods.forEach.call( allStyles, function ( entry ) {
    Style[ entry ] = entry
  })

  // Enumerates all CSS properties possible in a browser. Takes care of prefixing. You don't need it but it's useful.
  getOwnPropertyNames( Style ).forEach( function ( entry ) {
    if ( vendorRegex.test( entry ) ) {
      Style[ entry.replace( vendorRegex, newStyleAttribute ) ] = entry
      delete Style[ entry ]
    }
  })
  freeze( Style )

  DJ.Enums.Style = Style

  // Without arguments, returns the style object of the first element. Not chainable.
  // Returns the computed CSS property of the first element if attribute is present. Not chainable.
  // Sets the CSS property to the value if value is present. Chainable.
  DJ.prototype.style = function ( attr, value ) {
    if ( arguments.length === 0 ) return this.element( 0 ).style
    if ( isUndefined( value ) ) {
      return getComputedStyle( this.element(0) )[ camelCase( attr ) ]
    }
    else {
      return this.each( function () {
        this.style[ camelCase( attr ) ] = value
      })
    }
  }

  // Beginning of the classList compliance shim.
  var classList = 'classList'

  var list = fakeElement.classList

  var DOMTokenList = list.constructor

  list.add( 'add', 'remove' )

  if ( ! list.contains( 'remove' ) ) {
    (function () {

      [ 'add', 'remove' ].forEach( function ( entry ) {

        var originalMethod = DOMTokenList.prototype[ entry ]

        DOMTokenList.prototype[ entry ] = function ( token ) {
          var i, len = arguments.length

          for ( i = 0; i < len; i++ ) {
            token = arguments[i]
            originalMethod.call(this, token)
          }
        }
      })
    })()
  }

  list.toggle( 'toggle', false )

  if ( list.contains( 'toggle' ) ) {
    (function () {
      var toggleMethod = DOMTokenList.prototype.toggle

      DOMTokenList.prototype.toggle = function ( token, force ) {
        if ( 1 in arguments && !this.contains( token ) === !force ) {
          return force
        }
        else {
          return toggleMethod.call( this, token )
        }
      }
    })()
  }
  // End of compliance shim


  // Adds, removes, toggles classes. Works exactly like classList methods. Chainable.
  internalMethods.forEach.call( [ 'add', 'remove', 'toggle' ], function ( entry ) {
    DJ.prototype[ entry + 'Class' ] = function () {
      var arr = arguments
      return this.each( function () {
        fakeElement.classList[entry].apply( this.classList, arr )
      })
    }
  })

  // Returns whether or not the first element contains the class. Not chainable.
  DJ.prototype.containsClass = function ( entry ) {
    return this.element( 0 ).classList.contains( entry )
  }

  /*
  * --------------------------------------------------
  * End of appearance alterations
  * --------------------------------------------------
  */


  /*
  * ==================================================
  * DOM object hide and show
  * --------------------------------------------------
  * Relies on [hidden]
  * Force [hidden] to display: none in CSS for this to work.
  * You might need to make that rule !important
  * ==================================================
  */

  DJ.prototype.hide = function () {
    return this.each( function () {
      this.hidden = true
    })
  }

  DJ.prototype.unhide = function () {
    return this.each( function () {
      this.hidden = false
    })
  }

  /*
  * --------------------------------------------------
  * End of hide and show
  * --------------------------------------------------
  */



  /*
  * ==================================================
  * Common function and object aliases
  * --------------------------------------------------
  * Used to set timeouts and intervals and clear them.
  * They're here because of extreme paranoia.
  * ==================================================
  */

  DJ.timer = window.setInterval.bind()
  DJ.delay = window.setTimeout.bind()
  DJ.cancelTimer = window.clearInterval.bind()
  DJ.cancelDelay = window.clearTimeout.bind()

  DJ.window = window
  DJ.document = document

  /*
  * --------------------------------------------------
  * End of common objects
  * --------------------------------------------------
  */



  /*
  * ==================================================
  * QueryString object
  * --------------------------------------------------
  * Sets itself on load of DJ.
  * Client side query string readability is possible.
  * ==================================================
  */
  ;(function ( DJ ) {
    'use strict'

    var QueryString = {}

    var queryRegex = /(\?|&)([^=&]+)(=([^&]*))?/g
    var plus = /\+/g

    var readable = function ( str, parse ) {
      if ( !str ) return
      var temp = decodeURIComponent( str.replace( plus, ' ' ) )
      if ( parse ) {
        if ( temp == parseInt( temp ) ) return parseInt( temp )
        else if ( temp == parseFloat( temp ) ) return parseFloat( temp )
      }
      return temp;
    }

    window.location.search.replace( queryRegex, function ( whole, eq, entry, eq_, value ) {
      QueryString[ readable(entry) ] = readable( value, true )
    });

    DJ.QueryString = QueryString

  })( DJ );

  /*
  * --------------------------------------------------
  * End of query string
  * --------------------------------------------------
  */

  // Make the DJ object available in the global namespace.

  window.DJ = DJ

})( window, document );