import {
  push, forEach, filter, map, concat, some
} from '@dnvr/array-methods'

// Common strings
var asterisk = '*'
var empty = ''

// Common internal checker functions
function isUndefined ( candidate: any ): candidate is undefined {
  return candidate === undefined
}
function isNull ( candidate: any ): candidate is null {
  return candidate === null
}

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
  Boolean: ( false ).constructor,
  Number: ( 0 ).constructor,
  String: empty.constructor,
  Array: [].constructor,
  Function: empty.constructor.constructor,
  Object: ( {} ).constructor,
  RegExp: /0/.constructor
}

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

const camelCase = ( function () {

  const hyphenCase = /-([a-z])/g

  const camelCaseReplacement = function ( _s: string, first: string ) {
    return first.toUpperCase()
  }

  return function camelCase ( s: string ) {
    return s.replace( hyphenCase, camelCaseReplacement )
  }

} )()

const hyphenCase = ( function () {

  const camelCase = /([A-Z])/g

  const hyphenCaseReplacement = function ( s: string ) {
    return '-' + s.toLowerCase()
  }

  return function hyphenCase ( s: string ) {
    return s.replace( camelCase, hyphenCaseReplacement )
  }

} )()

function setProp ( this: any, prop: string, val: any ) {
  Object.defineProperty( this, prop, {
    get: function () {
      return val
    }
  } )
}

const internalMethods = function () {

  let {
    push,
    pop,
    shift,
    unshift,

    indexOf,
    slice,
    splice,

    map,

    forEach
  } = []

  return {
    push,
    pop,
    shift,
    unshift,

    indexOf,
    slice,
    splice,

    map,

    forEach
  }
}()

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
var DataStore = ( function () {

  var cache = 'cache'
  var position = 'position'

  function DataStore () {
    setProp.call( this, cache, [] )
  }

  DataStore.prototype.position = function ( ref, key ) {
    var current = -1

    this.cache.some( function ( entry, index ) {
      return ( entry.asset === ref && entry.key === key ) ? ( current = index, true ) : false
    } )

    return current
  }

  DataStore.prototype.read = function ( ref, keystring ) {
    var current = this.cache[ this.position( ref, keystring ) ]
    return current && current.data
  }

  DataStore.prototype.add = function ( ref, keystring, entry ) {
    var current = this.cache[ this.position( ref, keystring ) ]

    if ( current ) {
      current.data = entry
    }
    else {
      this.cache.push( {
        asset: ref,
        key: keystring,
        data: entry
      } )
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

} )()
/*
* --------------------------------------------------
* End of DataStore
* --------------------------------------------------
*/

var DataSet = new DataStore()

var Data = function ( object, key, entry ) {
  if ( isNull( key ) || isUndefined( key ) || !DJ.isObject( object ) ) return
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

  target = count === 1 ? this : ( index++, args[ 0 ] )

  for ( ; index < count; index++ ) {
    if ( DJ.isObject( temp = args[ index ] ) ) {
      getOwnPropertyNames( temp ).forEach( function ( entry ) {
        target[ entry ] = temp[ entry ]
      } )
    }
  }

  return target
}

// Matches shim
void ( function ( shim ) {

  shim.matches = shim.matches || shim.webkitMatchesSelector || shim.mozMatchesSelector || msMatchesSelector

} )( HTMLElement.prototype )

// Defining the DJ class and its essential methods
function DJ ( selector ) {
  return new initialise( selector )
}

function splitter ( entry: HTMLElement ): DJClass {
  return new DJClass( entry )
}
function combinator ( ...entry: DJClass[] ): DJClass {
  return new DJClass( concat( ...entry ) )
}

type Class<T = any> = {
  new( ...args: any[] ): T
  prototype: T
}

class DJClass {

  [ index: number ]: HTMLElement
  length: number = 0

  constructor ()
  constructor ( element: HTMLElement )
  constructor ( array: ArrayLike<HTMLElement> )
  constructor ( entry?: HTMLElement | ArrayLike<HTMLElement> ) {
    if ( undefined === entry ) {
    }
    else if ( entry instanceof HTMLElement ) {
      this.add( entry as HTMLElement )
    }
    else if ( Reflect.has( entry, 'length' ) ) {
      this.add( ...entry as Array<HTMLElement> )
    }
  }

  element ( index: number ): HTMLElement | null {
    if ( 0 !== this.length ) {
      index = index | 0
      while ( index < 0 ) {
        index = index + this.length
      }
      while ( index >= this.length ) {
        index = index - this.length
      }
      return this[ index ]
    }
    return null
  }

  index ( index: number ): DJClass {
    let element = this.element( index )

    if ( element ) {
      return new DJClass( element )
    }
    else {
      return new DJClass
    }
  }

  first (): DJClass {
    return this.index( 0 )
  }
  last (): DJClass {
    return this.index( -1 )
  }

  add ( ...elements: HTMLElement[] ): this {
    push( this, ...elements )

    return this
  }

  each ( f: ( this: this, entry: HTMLElement, index: number ) => void ): this {
    forEach( this, f, this )

    return this
  }

  explode (): Array<DJClass> {
    return map( this, splitter, this )
  }

  is ( selector: string ): boolean {
    let el = this.element( 0 )
    if ( el === null ) {
      return false
    }
    else {
      return el.matches( selector )
    }
  }

  attr ( name: string ): string
  attr ( name: string, value: null ): this
  attr ( name: string, value: string ): this
  attr ( name: string, value?: any ): any {
    switch ( arguments.length ) {
      case 1:
        return this.element( 0 )?.getAttribute( name )

      case 2:
        if ( null === value ) {
          this.each( ( e ) => {
            e.removeAttribute( name )
          } )
        }
        else {
          this.each( ( e ) => {
            e.setAttribute( name, value )
          } )
        }
        break
    }
  }

  style ( name: keyof CSSStyleDeclaration, value: string ): this {
    if ( name === 'length' || name === 'parentRule' || name === 'setProperty' || name === 'removeProperty' || name === 'getPropertyValue' || name === 'getPropertyPriority' || name === 'item' ) {
      return this
    }
    else {
      return this.each( e => {
        e.style[ name ] = value
      } )
    }
  }

  filter ( selector: string ): DJClass
  filter ( f: ( this: this, entry: DJClass, index: number, array: Array<DJClass> ) => boolean ): DJClass
  filter ( entry: any ): DJClass {
    if ( 'string' === typeof entry ) {
      return combinator( ...filter( this.explode(), function ( e ): boolean { return e.is( this.valueOf() ) }, entry ) )
      // return combinator( ...this.explode().filter( function ( this: string, e: DJClass ) { return e.is( this.valueOf() ) }, entry ) )
    }
    else {
      return combinator( ...this.explode().filter( entry, this ) )
    }
  }

  text (): string
  text ( s: string ): this
  text ( s?: string ) {
    if ( 'string' === typeof s ) {
      this.each( ( e: HTMLElement ) => {
        e.textContent = s
      } )
      return this
    }
    else {
      return this.element( 0 )?.textContent
    }
  }

  html (): string
  html ( h: string ): this
  html ( h?: string ) {
    if ( 'string' === typeof h ) {
      this.each( ( e: HTMLElement ) => {
        e.innerHTML = h
      } )
      return this
    }
    else {
      return this.element( 0 )?.innerHTML
    }
  }

  content ( h: string ): this
  content ( h: HTMLElement ): this
  content ( h: any ): this {
    if ( 'string' === typeof h ) {
      return this.html( h )
    }
    else {
      return this.each( ( e ) => {
        e.innerHTML = ''
        e.appendChild( h.cloneNode( true ) )
      } )
    }
  }

  hide () {
    return this.each( hide )
  }

  unhide () {
    return this.each( unhide )
  }

  empty () {
    return this.html( '' )
  }
}

function hide ( this: DJClass, e: HTMLElement ) {
  e.hidden = true
}

function unhide ( this: DJClass, e: HTMLElement ) {
  e.hidden = false
}

interface IDJ {
  new(): DJClass
  new( element: HTMLElement ): DJClass
  new( array: ArrayLike<HTMLElement> ): DJClass

  (): DJClass
  ( element: HTMLElement ): DJClass
  ( array: ArrayLike<HTMLElement> ): DJClass

  prototype: DJClass
}

const DJAccess: IDJ = <any> new Proxy( DJClass, {
  getPrototypeOf ( target: typeof DJClass ) {
    return target
  },
  apply ( _target: typeof DJClass, _thisArg: any, argArray: ConstructorParameters<typeof DJClass> ) {
    return new DJAccess( ...argArray )
  },
  construct ( target: typeof DJClass, args: ConstructorParameters<typeof DJClass> ) {
    let [ selector ] = args

    if ( selector instanceof DJAccess ) {
      return selector
    }
    else if ( 'string' === typeof selector ) {
      let param: ArrayLike<HTMLElement> = []

      try {
        param = document.querySelectorAll( selector )
      }
      catch {
        param = []
      }
      finally {
        return new target( param )
      }
    }
    else if ( selector instanceof HTMLElement ) {
      return new target( selector )
    }
    else if ( selector instanceof HTMLCollection || selector instanceof NodeList ) {
      return new target( selector )
    }
    else {
      return new target()
    }
  }
} )

export { DJClass, DJAccess }

namespace DJClass {

  export function is<K, L> ( candidate: K, clas: Class<L> ): K extends L ? true : false
  export function is ( candidate: any, clas: Class ): boolean {
    return candidate instanceof clas
  }

  export function isUndefined ( candidate: any ): candidate is undefined {
    return undefined === candidate
  }

  export function isNull ( candidate: any ): candidate is null {
    return null === candidate
  }

  export function isString ( candidate: any ): candidate is string {
    return 'string' === typeof candidate || !( isUndefined( candidate ) || isNull( candidate ) ) && candidate.constructor === String
  }

  export function isNumber ( candidate: any ): candidate is number {
    return 'number' === typeof candidate || !( isUndefined( candidate ) || isNull( candidate ) ) && candidate.constructor === Number
  }

  export function isBoolean ( candidate: any ): candidate is boolean {
    return 'boolean' === typeof candidate || !( isUndefined( candidate ) || isNull( candidate ) ) && candidate.constructor === Boolean
  }

  export function isRegExp ( candidate: any ): candidate is RegExp {
    return !( isUndefined( candidate ) || isNull( candidate ) ) && candidate.constructor === RegExp
  }

  export const Enums = {}
}

DJ.Enums = {}

DJ.Discovered = {}

DJ.Data = Data

DJ.DataStore = DataStore

DJ.Extend = Extend

DJ.Types = Types

DJ.Proxy = function ( f, proxyThis ) {
  var args = internalMethods.slice.call( arguments, 2 )
  var functn = function () {
    f.apply( proxyThis || this, args.concat( internalMethods.slice.call( arguments ) ) )
  }
  return functn
}

// Done only to make the DJ object look like an array in Chrome and Safari
DJ.prototype.splice = internalMethods.splice

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
    catch ( e ) {
    }
    finally {
      internalMethods.forEach.call( selector, function ( entry ) {
        internalMethods.push.call( me, entry )
      } )
    }
  }
}
initialise.prototype = DJ.prototype

// Primary method for performing DOM object manipulation on every element in a DJ collection. Always returns a DJ object
DJ.prototype.each = function ( fn ) {
  internalMethods.forEach.call( this, function ( entry ) {
    fn.call( entry )
  } )

  return this
}


/*
* ==================================================
* DJ internal methods
* --------------------------------------------------
* These functions are not exposed to the public scope.
* ==================================================
*/
internalMethods.unique = function () {
  var i = this.length
  while ( i-- ) {
    if ( i !== internalMethods.indexOf.call( this, this[ i ] ) ) {
      internalMethods.splice.call( this, i, 1 )
    }
  }
}
internalMethods.forEachReverse = function ( fn, thisArg ) {
  var k = this.length
  while ( k-- ) {
    fn.call( thisArg, this[ k ], k, this )
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
    } )
  }

  return this
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
        } )
      } )
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
    } )
  } )

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
  } )

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
  } )

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
  } )

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
  } )
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
  DJ.prototype[ entry ] = function ( value ) {
    if ( isUndefined( value ) ) {
      return this.view()[ entry ]
    }
    else {
      return this.each( function () {
        this.style[ entry ] = value == parseInt( value ) ? + value + 'px' : value
      } )
    }
  }
} )

// Returns attribute value if attribute name is specified. Not chainable.
// Sets attribute value for each element if value is speficied and returns DJ object. Chainable.
// Removes attributes of each element if value is explicitly set to undefined. Chainable.
DJ.prototype.attr = function ( attr, value ) {
  if ( isUndefined( value ) ) {
    if ( arguments.length < 2 ) {
      return this.element( 0 ).getAttribute( attr )
    }
    else {
      return this.each( function () {
        this.removeAttribute( attr )
      } )
    }
  }
  else {
    return this.each( function () {
      this.setAttribute( attr, value )
    } )
  }
}

// Returns aria attribute value if aria attribute name is specified. Not chainable.
// Sets aria attribute value for each element if value is speficied and returns DJ object. Chainable.
// Removes aria attribute of each element if value is explicitly set to undefined. Chainable.
// DJ.prototype.aria = function ( attr, value ) {
//   if ( isUndefined( value ) ) {
//     if ( arguments.length < 2 ) {
//       return this.element( 0 ).getAttribute( 'aria-' + attr )
//     }
//     else {
//       return this.each( function () {
//         this.removeAttribute( 'aria-' + attr )
//       } )
//     }
//   }
//   else {
//     return this.each( function () {
//       this.setAttribute( 'aria-' + attr, value )
//     } )
//   }
// }

// Returns live dataset of first element if attribute name is not specified. Not chainable.
// Returns dataset attribute value if attribute name is specified. Not chainable.
// Sets dataset attribute value for each element if value is speficied and returns DJ object. Chainable.
// Removes dataset attributes of each element if value is explicitly set to undefined. Chainable.
// DJ.prototype.data = function ( attr, value ) {
//   switch ( arguments.length ) {
//     case 0:
//       return this.element( 0 ).dataset
//     case 1:
//       return this.element( 0 ).dataset[ camelCase( attr ) ]
//     default:
//       if ( isUndefined( value ) ) {
//         return this.each( function () {
//           this.removeAttribute( 'data-' + hyphenCase( attr ) )
//         } )
//       }
//       else {
//         return this.each( function () {
//           this.dataset[ camelCase( attr ) ] = value
//         } )
//       }
//   }
// }

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
    } )
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
    } )
  }
  var out = new initialise( fakeElement.childNodes )

  internalMethods.forEachReverse.call( fakeElement.childNodes, function ( entry ) {
    fakeElement.removeChild( entry )
  } )

  return out
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
      } )
    } )
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
    } )
  } )

  return this
}

// Adds synthesised stuff to the end of each element.
DJ.prototype.append = function ( content ) {
  var fakeDJ = internalMethods.synthElements( content )

  this.each( function () {
    var me = this
    internalMethods.forEach.call( fakeDJ, function ( entry ) {
      me.appendChild( entry.cloneNode( true ) )
    } )
  } )

  return this
}

// Adds synthesised stuff before each element.
DJ.prototype.before = function ( content ) {
  var fakeDJ = internalMethods.synthElements( content )

  this.each( function () {
    var me = this

    internalMethods.forEach.call( fakeDJ, function ( entry ) {
      me.parentNode.insertBefore( entry.cloneNode( true ), me )
    } )
  } )

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
    } )
  } )

  return this
}

// Triggers a custom event based on the message passed. Accepts a message string or an event object. Bubbles. Chainable.
DJ.prototype.trigger = function ( message, detail, params ) {
  if ( DJ.isObject( params ) ) params.detail = detail
  message = checkIfInstanceOf( message, Event ) ? message : new CustomEvent( message, params || { bubbles: true, detail: detail } )
  return this.each( function () {
    this.dispatchEvent( message )
  } )
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

    while ( !eventObject.cancelBubble && target !== this ) {
      if ( target.matches( selector ) ) {
        fn.call( target, eventObject )
      }
      target = target.parentNode
    }
  } : fn

  this.each( function () {
    this.addEventListener( message, fnx )
  } )

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
  } )
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
      fn.call( this, eventObject )
    }
  }
  this.each( function () {
    this.addEventListener( message, fnx )
  } )

  return release ? fnx : this
}

// Creates shorthand methods for common events that use attach internally with the first parameter as the name of the method. Chainable.
// Not passing a function as a parameter will trigger the event. Chainable.
internalMethods.forEach.call( 'click|dblclick|mouseover|mouseout|keydown|keypress|keyup'.split( '|' ), function ( entry ) {
  DJ.prototype[ entry ] = function ( fn, selector, once ) {
    if ( !DJ.isFunction( fn ) ) {
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
} )

// Special case event handler. Chainable.
DJ.prototype.hover = function ( fnOver, fnOut ) {
  return this.mouseover( fnOver ).mouseout( fnOut || fnOver )
}

// Attaches functions to the scroll and resize events of the window object. These events cannot be triggered by simply calling the function without arguments.
internalMethods.forEach.call( [ 'scroll', 'resize' ], function ( entry ) {
  DJ[ entry ] = function ( fn ) {
    window.addEventListener( entry, fn )
  }
} )

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

var getComputedStyle = window.getComputedStyle

var Style = {}

let allStyles = getOwnPropertyNames( fakeElement.style )

let vendorCheck = ( internalMethods.slice.call( getComputedStyle( document.documentElement ) ).join( empty ).match( /-(webkit|moz|ms)-/ ) || [ empty, empty ] )[ 1 ]

setProp.call( DJ.Discovered, 'Vendor', vendorCheck )

var vendorRegex = new Types.RegExp( '^' + vendorCheck + '([A-Z])' )

var newStyleAttribute = function ( full, first ) {
  return first.toLowerCase()
}

internalMethods.forEach.call( allStyles, function ( entry ) {
  Style[ entry ] = entry
} )

// Enumerates all CSS properties possible in a browser. Takes care of prefixing. You don't need it but it's useful.
getOwnPropertyNames( Style ).forEach( function ( entry ) {
  if ( vendorRegex.test( entry ) ) {
    Style[ entry.replace( vendorRegex, newStyleAttribute ) ] = entry
    delete Style[ entry ]
  }
} )
// freeze( Style )

DJ.Enums.Style = Style

// Without arguments, returns the style object of the first element. Not chainable.
// Returns the computed CSS property of the first element if attribute is present. Not chainable.
// Sets the CSS property to the value if value is present. Chainable.
DJ.prototype.style = function ( attr, value ) {
  if ( arguments.length === 0 ) return this.element( 0 ).style
  if ( isUndefined( value ) ) {
    return getComputedStyle( this.element( 0 ) )[ camelCase( attr ) ]
  }
  else {
    return this.each( function () {
      this.style[ camelCase( attr ) ] = value
    } )
  }
}

// Beginning of the classList compliance shim.
var classList = 'classList'

var list = fakeElement.classList

var DOMTokenList = list.constructor

list.add( 'add', 'remove' )

if ( !list.contains( 'remove' ) ) {
  ( function () {

    [ 'add', 'remove' ].forEach( function ( entry ) {

      var originalMethod = DOMTokenList.prototype[ entry ]

      DOMTokenList.prototype[ entry ] = function ( token ) {
        var i, len = arguments.length

        for ( i = 0; i < len; i++ ) {
          token = arguments[ i ]
          originalMethod.call( this, token )
        }
      }
    } )
  } )()
}

list.toggle( 'toggle', false )

if ( list.contains( 'toggle' ) ) {
  ( function () {
    var toggleMethod = DOMTokenList.prototype.toggle

    DOMTokenList.prototype.toggle = function ( token, force ) {
      if ( 1 in arguments && !this.contains( token ) === !force ) {
        return force
      }
      else {
        return toggleMethod.call( this, token )
      }
    }
  } )()
}
// End of compliance shim


// Adds, removes, toggles classes. Works exactly like classList methods. Chainable.
internalMethods.forEach.call( [ 'add', 'remove', 'toggle' ], function ( entry ) {
  DJ.prototype[ entry + 'Class' ] = function () {
    var arr = arguments
    return this.each( function () {
      fakeElement.classList[ entry ].apply( this.classList, arr )
    } )
  }
} )

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
  } )
}

DJ.prototype.unhide = function () {
  return this.each( function () {
    this.hidden = false
  } )
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
  ; ( function ( DJ ) {
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
      return temp
    }

    window.location.search.replace( queryRegex, function ( whole, eq, entry, eq_, value ) {
      QueryString[ readable( entry ) ] = readable( value, true )
    } )

    DJ.QueryString = QueryString

  } )( DJ )

/*
* --------------------------------------------------
* End of query string
* --------------------------------------------------
*/

export default DJ
