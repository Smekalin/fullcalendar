
/* A rectangular panel that is absolutely positioned over other content
------------------------------------------------------------------------------------------------------------------------
Options:
  - className (string)
  - content (HTML string or jQuery element set)
  - parentEl
  - top
  - left
  - right (the x coord of where the right edge should be. not a "CSS" right)
  - autoHide (boolean)
  - show (callback)
  - hide (callback)
*/

import * as $ from 'jquery/dist/jquery.slim'
import { getScrollParent } from '../util'
import { default as ListenerMixin, ListenerInterface } from './ListenerMixin'


export default class Popover {

  listenTo: ListenerInterface['listenTo']
  stopListeningTo: ListenerInterface['stopListeningTo']

  isHidden: boolean = true
  options: any
  el: any // the container element for the popover. generated by this object
  margin: number = 10 // the space required between the popover and the edges of the scroll container


  constructor(options) {
    this.options = options || {}
  }


  // Shows the popover on the specified position. Renders it if not already
  show() {
    if (this.isHidden) {
      if (!this.el) {
        this.render()
      }
      this.el.show()
      this.position()
      this.isHidden = false
      this.trigger('show')
    }
  }


  // Hides the popover, through CSS, but does not remove it from the DOM
  hide() {
    if (!this.isHidden) {
      this.el.hide()
      this.isHidden = true
      this.trigger('hide')
    }
  }


  // Creates `this.el` and renders content inside of it
  render() {
    let options = this.options

    this.el = $('<div class="fc-popover"/>')
      .addClass(options.className || '')
      .css({
        // position initially to the top left to avoid creating scrollbars
        top: 0,
        left: 0
      })
      .append(options.content)
      .appendTo(options.parentEl)

    // when a click happens on anything inside with a 'fc-close' className, hide the popover
    this.el.on('click', '.fc-close', () => {
      this.hide()
    })

    if (options.autoHide) {
      this.listenTo($(document), 'mousedown', this.documentMousedown)
    }
  }


  // Triggered when the user clicks *anywhere* in the document, for the autoHide feature
  documentMousedown(ev) {
    // only hide the popover if the click happened outside the popover
    if (this.el && !$(ev.target).closest(this.el).length) {
      this.hide()
    }
  }


  // Hides and unregisters any handlers
  removeElement() {
    this.hide()

    if (this.el) {
      this.el.remove()
      this.el = null
    }

    this.stopListeningTo($(document), 'mousedown')
  }


  // Positions the popover optimally, using the top/left/right options
  position() {
    let options = this.options
    let origin = this.el.offsetParent().offset()
    let width = this.el.outerWidth()
    let height = this.el.outerHeight()
    let windowEl = $(window)
    let viewportEl = getScrollParent(this.el)
    let viewportTop
    let viewportLeft
    let viewportOffset
    let top // the "position" (not "offset") values for the popover
    let left //

    // compute top and left
    top = options.top || 0
    if (options.left !== undefined) {
      left = options.left
    } else if (options.right !== undefined) {
      left = options.right - width // derive the left value from the right value
    } else {
      left = 0
    }

    if (viewportEl.is(window) || viewportEl.is(document)) { // normalize getScrollParent's result
      viewportEl = windowEl
      viewportTop = 0 // the window is always at the top left
      viewportLeft = 0 // (and .offset() won't work if called here)
    } else {
      viewportOffset = viewportEl.offset()
      viewportTop = viewportOffset.top
      viewportLeft = viewportOffset.left
    }

    // if the window is scrolled, it causes the visible area to be further down
    viewportTop += windowEl.scrollTop()
    viewportLeft += windowEl.scrollLeft()

    // constrain to the view port. if constrained by two edges, give precedence to top/left
    if (options.viewportConstrain !== false) {
      top = Math.min(top, viewportTop + viewportEl.outerHeight() - height - this.margin)
      top = Math.max(top, viewportTop + this.margin)
      left = Math.min(left, viewportLeft + viewportEl.outerWidth() - width - this.margin)
      left = Math.max(left, viewportLeft + this.margin)
    }

    this.el.css({
      top: top - origin.top,
      left: left - origin.left
    })
  }


  // Triggers a callback. Calls a function in the option hash of the same name.
  // Arguments beyond the first `name` are forwarded on.
  // TODO: better code reuse for this. Repeat code
  trigger(name) {
    if (this.options[name]) {
      this.options[name].apply(this, Array.prototype.slice.call(arguments, 1))
    }
  }

}

ListenerMixin.mixInto(Popover)
