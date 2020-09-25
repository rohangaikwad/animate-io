"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 */
(function () {
  'use strict'; // Exit early if we're not running in a browser.

  if ((typeof window === "undefined" ? "undefined" : _typeof(window)) !== 'object') {
    return;
  } // Exit early if all IntersectionObserver and IntersectionObserverEntry
  // features are natively supported.


  if ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
    // Minimal polyfill for Edge 15's lack of `isIntersecting`
    // See: https://github.com/w3c/IntersectionObserver/issues/211
    if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
      Object.defineProperty(window.IntersectionObserverEntry.prototype, 'isIntersecting', {
        get: function get() {
          return this.intersectionRatio > 0;
        }
      });
    }

    return;
  }
  /**
   * Returns the embedding frame element, if any.
   * @param {!Document} doc
   * @return {!Element}
   */


  function getFrameElement(doc) {
    try {
      return doc.defaultView && doc.defaultView.frameElement || null;
    } catch (e) {
      // Ignore the error.
      return null;
    }
  }
  /**
   * A local reference to the root document.
   */


  var document = function (startDoc) {
    var doc = startDoc;
    var frame = getFrameElement(doc);

    while (frame) {
      doc = frame.ownerDocument;
      frame = getFrameElement(doc);
    }

    return doc;
  }(window.document);
  /**
   * An IntersectionObserver registry. This registry exists to hold a strong
   * reference to IntersectionObserver instances currently observing a target
   * element. Without this registry, instances without another reference may be
   * garbage collected.
   */


  var registry = [];
  /**
   * The signal updater for cross-origin intersection. When not null, it means
   * that the polyfill is configured to work in a cross-origin mode.
   * @type {function(DOMRect|ClientRect, DOMRect|ClientRect)}
   */

  var crossOriginUpdater = null;
  /**
   * The current cross-origin intersection. Only used in the cross-origin mode.
   * @type {DOMRect|ClientRect}
   */

  var crossOriginRect = null;
  /**
   * Creates the global IntersectionObserverEntry constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-entry
   * @param {Object} entry A dictionary of instance properties.
   * @constructor
   */

  function IntersectionObserverEntry(entry) {
    this.time = entry.time;
    this.target = entry.target;
    this.rootBounds = ensureDOMRect(entry.rootBounds);
    this.boundingClientRect = ensureDOMRect(entry.boundingClientRect);
    this.intersectionRect = ensureDOMRect(entry.intersectionRect || getEmptyRect());
    this.isIntersecting = !!entry.intersectionRect; // Calculates the intersection ratio.

    var targetRect = this.boundingClientRect;
    var targetArea = targetRect.width * targetRect.height;
    var intersectionRect = this.intersectionRect;
    var intersectionArea = intersectionRect.width * intersectionRect.height; // Sets intersection ratio.

    if (targetArea) {
      // Round the intersection ratio to avoid floating point math issues:
      // https://github.com/w3c/IntersectionObserver/issues/324
      this.intersectionRatio = Number((intersectionArea / targetArea).toFixed(4));
    } else {
      // If area is zero and is intersecting, sets to 1, otherwise to 0
      this.intersectionRatio = this.isIntersecting ? 1 : 0;
    }
  }
  /**
   * Creates the global IntersectionObserver constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-interface
   * @param {Function} callback The function to be invoked after intersection
   *     changes have queued. The function is not invoked if the queue has
   *     been emptied by calling the `takeRecords` method.
   * @param {Object=} opt_options Optional configuration options.
   * @constructor
   */


  function IntersectionObserver(callback, opt_options) {
    var options = opt_options || {};

    if (typeof callback != 'function') {
      throw new Error('callback must be a function');
    }

    if (options.root && options.root.nodeType != 1) {
      throw new Error('root must be an Element');
    } // Binds and throttles `this._checkForIntersections`.


    this._checkForIntersections = throttle(this._checkForIntersections.bind(this), this.THROTTLE_TIMEOUT); // Private properties.

    this._callback = callback;
    this._observationTargets = [];
    this._queuedEntries = [];
    this._rootMarginValues = this._parseRootMargin(options.rootMargin); // Public properties.

    this.thresholds = this._initThresholds(options.threshold);
    this.root = options.root || null;
    this.rootMargin = this._rootMarginValues.map(function (margin) {
      return margin.value + margin.unit;
    }).join(' ');
    /** @private @const {!Array<!Document>} */

    this._monitoringDocuments = [];
    /** @private @const {!Array<function()>} */

    this._monitoringUnsubscribes = [];
  }
  /**
   * The minimum interval within which the document will be checked for
   * intersection changes.
   */


  IntersectionObserver.prototype.THROTTLE_TIMEOUT = 100;
  /**
   * The frequency in which the polyfill polls for intersection changes.
   * this can be updated on a per instance basis and must be set prior to
   * calling `observe` on the first target.
   */

  IntersectionObserver.prototype.POLL_INTERVAL = null;
  /**
   * Use a mutation observer on the root element
   * to detect intersection changes.
   */

  IntersectionObserver.prototype.USE_MUTATION_OBSERVER = true;
  /**
   * Sets up the polyfill in the cross-origin mode. The result is the
   * updater function that accepts two arguments: `boundingClientRect` and
   * `intersectionRect` - just as these fields would be available to the
   * parent via `IntersectionObserverEntry`. This function should be called
   * each time the iframe receives intersection information from the parent
   * window, e.g. via messaging.
   * @return {function(DOMRect|ClientRect, DOMRect|ClientRect)}
   */

  IntersectionObserver._setupCrossOriginUpdater = function () {
    if (!crossOriginUpdater) {
      /**
       * @param {DOMRect|ClientRect} boundingClientRect
       * @param {DOMRect|ClientRect} intersectionRect
       */
      crossOriginUpdater = function crossOriginUpdater(boundingClientRect, intersectionRect) {
        if (!boundingClientRect || !intersectionRect) {
          crossOriginRect = getEmptyRect();
        } else {
          crossOriginRect = convertFromParentRect(boundingClientRect, intersectionRect);
        }

        registry.forEach(function (observer) {
          observer._checkForIntersections();
        });
      };
    }

    return crossOriginUpdater;
  };
  /**
   * Resets the cross-origin mode.
   */


  IntersectionObserver._resetCrossOriginUpdater = function () {
    crossOriginUpdater = null;
    crossOriginRect = null;
  };
  /**
   * Starts observing a target element for intersection changes based on
   * the thresholds values.
   * @param {Element} target The DOM element to observe.
   */


  IntersectionObserver.prototype.observe = function (target) {
    var isTargetAlreadyObserved = this._observationTargets.some(function (item) {
      return item.element == target;
    });

    if (isTargetAlreadyObserved) {
      return;
    }

    if (!(target && target.nodeType == 1)) {
      throw new Error('target must be an Element');
    }

    this._registerInstance();

    this._observationTargets.push({
      element: target,
      entry: null
    });

    this._monitorIntersections(target.ownerDocument);

    this._checkForIntersections();
  };
  /**
   * Stops observing a target element for intersection changes.
   * @param {Element} target The DOM element to observe.
   */


  IntersectionObserver.prototype.unobserve = function (target) {
    this._observationTargets = this._observationTargets.filter(function (item) {
      return item.element != target;
    });

    this._unmonitorIntersections(target.ownerDocument);

    if (this._observationTargets.length == 0) {
      this._unregisterInstance();
    }
  };
  /**
   * Stops observing all target elements for intersection changes.
   */


  IntersectionObserver.prototype.disconnect = function () {
    this._observationTargets = [];

    this._unmonitorAllIntersections();

    this._unregisterInstance();
  };
  /**
   * Returns any queue entries that have not yet been reported to the
   * callback and clears the queue. This can be used in conjunction with the
   * callback to obtain the absolute most up-to-date intersection information.
   * @return {Array} The currently queued entries.
   */


  IntersectionObserver.prototype.takeRecords = function () {
    var records = this._queuedEntries.slice();

    this._queuedEntries = [];
    return records;
  };
  /**
   * Accepts the threshold value from the user configuration object and
   * returns a sorted array of unique threshold values. If a value is not
   * between 0 and 1 and error is thrown.
   * @private
   * @param {Array|number=} opt_threshold An optional threshold value or
   *     a list of threshold values, defaulting to [0].
   * @return {Array} A sorted list of unique and valid threshold values.
   */


  IntersectionObserver.prototype._initThresholds = function (opt_threshold) {
    var threshold = opt_threshold || [0];
    if (!Array.isArray(threshold)) threshold = [threshold];
    return threshold.sort().filter(function (t, i, a) {
      if (typeof t != 'number' || isNaN(t) || t < 0 || t > 1) {
        throw new Error('threshold must be a number between 0 and 1 inclusively');
      }

      return t !== a[i - 1];
    });
  };
  /**
   * Accepts the rootMargin value from the user configuration object
   * and returns an array of the four margin values as an object containing
   * the value and unit properties. If any of the values are not properly
   * formatted or use a unit other than px or %, and error is thrown.
   * @private
   * @param {string=} opt_rootMargin An optional rootMargin value,
   *     defaulting to '0px'.
   * @return {Array<Object>} An array of margin objects with the keys
   *     value and unit.
   */


  IntersectionObserver.prototype._parseRootMargin = function (opt_rootMargin) {
    var marginString = opt_rootMargin || '0px';
    var margins = marginString.split(/\s+/).map(function (margin) {
      var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);

      if (!parts) {
        throw new Error('rootMargin must be specified in pixels or percent');
      }

      return {
        value: parseFloat(parts[1]),
        unit: parts[2]
      };
    }); // Handles shorthand.

    margins[1] = margins[1] || margins[0];
    margins[2] = margins[2] || margins[0];
    margins[3] = margins[3] || margins[1];
    return margins;
  };
  /**
   * Starts polling for intersection changes if the polling is not already
   * happening, and if the page's visibility state is visible.
   * @param {!Document} doc
   * @private
   */


  IntersectionObserver.prototype._monitorIntersections = function (doc) {
    var win = doc.defaultView;

    if (!win) {
      // Already destroyed.
      return;
    }

    if (this._monitoringDocuments.indexOf(doc) != -1) {
      // Already monitoring.
      return;
    } // Private state for monitoring.


    var callback = this._checkForIntersections;
    var monitoringInterval = null;
    var domObserver = null; // If a poll interval is set, use polling instead of listening to
    // resize and scroll events or DOM mutations.

    if (this.POLL_INTERVAL) {
      monitoringInterval = win.setInterval(callback, this.POLL_INTERVAL);
    } else {
      addEvent(win, 'resize', callback, true);
      addEvent(doc, 'scroll', callback, true);

      if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in win) {
        domObserver = new win.MutationObserver(callback);
        domObserver.observe(doc, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    }

    this._monitoringDocuments.push(doc);

    this._monitoringUnsubscribes.push(function () {
      // Get the window object again. When a friendly iframe is destroyed, it
      // will be null.
      var win = doc.defaultView;

      if (win) {
        if (monitoringInterval) {
          win.clearInterval(monitoringInterval);
        }

        removeEvent(win, 'resize', callback, true);
      }

      removeEvent(doc, 'scroll', callback, true);

      if (domObserver) {
        domObserver.disconnect();
      }
    }); // Also monitor the parent.


    if (doc != (this.root && this.root.ownerDocument || document)) {
      var frame = getFrameElement(doc);

      if (frame) {
        this._monitorIntersections(frame.ownerDocument);
      }
    }
  };
  /**
   * Stops polling for intersection changes.
   * @param {!Document} doc
   * @private
   */


  IntersectionObserver.prototype._unmonitorIntersections = function (doc) {
    var index = this._monitoringDocuments.indexOf(doc);

    if (index == -1) {
      return;
    }

    var rootDoc = this.root && this.root.ownerDocument || document; // Check if any dependent targets are still remaining.

    var hasDependentTargets = this._observationTargets.some(function (item) {
      var itemDoc = item.element.ownerDocument; // Target is in this context.

      if (itemDoc == doc) {
        return true;
      } // Target is nested in this context.


      while (itemDoc && itemDoc != rootDoc) {
        var frame = getFrameElement(itemDoc);
        itemDoc = frame && frame.ownerDocument;

        if (itemDoc == doc) {
          return true;
        }
      }

      return false;
    });

    if (hasDependentTargets) {
      return;
    } // Unsubscribe.


    var unsubscribe = this._monitoringUnsubscribes[index];

    this._monitoringDocuments.splice(index, 1);

    this._monitoringUnsubscribes.splice(index, 1);

    unsubscribe(); // Also unmonitor the parent.

    if (doc != rootDoc) {
      var frame = getFrameElement(doc);

      if (frame) {
        this._unmonitorIntersections(frame.ownerDocument);
      }
    }
  };
  /**
   * Stops polling for intersection changes.
   * @param {!Document} doc
   * @private
   */


  IntersectionObserver.prototype._unmonitorAllIntersections = function () {
    var unsubscribes = this._monitoringUnsubscribes.slice(0);

    this._monitoringDocuments.length = 0;
    this._monitoringUnsubscribes.length = 0;

    for (var i = 0; i < unsubscribes.length; i++) {
      unsubscribes[i]();
    }
  };
  /**
   * Scans each observation target for intersection changes and adds them
   * to the internal entries queue. If new entries are found, it
   * schedules the callback to be invoked.
   * @private
   */


  IntersectionObserver.prototype._checkForIntersections = function () {
    if (!this.root && crossOriginUpdater && !crossOriginRect) {
      // Cross origin monitoring, but no initial data available yet.
      return;
    }

    var rootIsInDom = this._rootIsInDom();

    var rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

    this._observationTargets.forEach(function (item) {
      var target = item.element;
      var targetRect = getBoundingClientRect(target);

      var rootContainsTarget = this._rootContainsTarget(target);

      var oldEntry = item.entry;

      var intersectionRect = rootIsInDom && rootContainsTarget && this._computeTargetAndRootIntersection(target, targetRect, rootRect);

      var newEntry = item.entry = new IntersectionObserverEntry({
        time: now(),
        target: target,
        boundingClientRect: targetRect,
        rootBounds: crossOriginUpdater && !this.root ? null : rootRect,
        intersectionRect: intersectionRect
      });

      if (!oldEntry) {
        this._queuedEntries.push(newEntry);
      } else if (rootIsInDom && rootContainsTarget) {
        // If the new entry intersection ratio has crossed any of the
        // thresholds, add a new entry.
        if (this._hasCrossedThreshold(oldEntry, newEntry)) {
          this._queuedEntries.push(newEntry);
        }
      } else {
        // If the root is not in the DOM or target is not contained within
        // root but the previous entry for this target had an intersection,
        // add a new record indicating removal.
        if (oldEntry && oldEntry.isIntersecting) {
          this._queuedEntries.push(newEntry);
        }
      }
    }, this);

    if (this._queuedEntries.length) {
      this._callback(this.takeRecords(), this);
    }
  };
  /**
   * Accepts a target and root rect computes the intersection between then
   * following the algorithm in the spec.
   * TODO(philipwalton): at this time clip-path is not considered.
   * https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
   * @param {Element} target The target DOM element
   * @param {Object} targetRect The bounding rect of the target.
   * @param {Object} rootRect The bounding rect of the root after being
   *     expanded by the rootMargin value.
   * @return {?Object} The final intersection rect object or undefined if no
   *     intersection is found.
   * @private
   */


  IntersectionObserver.prototype._computeTargetAndRootIntersection = function (target, targetRect, rootRect) {
    // If the element isn't displayed, an intersection can't happen.
    if (window.getComputedStyle(target).display == 'none') return;
    var intersectionRect = targetRect;
    var parent = getParentNode(target);
    var atRoot = false;

    while (!atRoot && parent) {
      var parentRect = null;
      var parentComputedStyle = parent.nodeType == 1 ? window.getComputedStyle(parent) : {}; // If the parent isn't displayed, an intersection can't happen.

      if (parentComputedStyle.display == 'none') return null;

      if (parent == this.root || parent.nodeType ==
      /* DOCUMENT */
      9) {
        atRoot = true;

        if (parent == this.root || parent == document) {
          if (crossOriginUpdater && !this.root) {
            if (!crossOriginRect || crossOriginRect.width == 0 && crossOriginRect.height == 0) {
              // A 0-size cross-origin intersection means no-intersection.
              parent = null;
              parentRect = null;
              intersectionRect = null;
            } else {
              parentRect = crossOriginRect;
            }
          } else {
            parentRect = rootRect;
          }
        } else {
          // Check if there's a frame that can be navigated to.
          var frame = getParentNode(parent);
          var frameRect = frame && getBoundingClientRect(frame);

          var frameIntersect = frame && this._computeTargetAndRootIntersection(frame, frameRect, rootRect);

          if (frameRect && frameIntersect) {
            parent = frame;
            parentRect = convertFromParentRect(frameRect, frameIntersect);
          } else {
            parent = null;
            intersectionRect = null;
          }
        }
      } else {
        // If the element has a non-visible overflow, and it's not the <body>
        // or <html> element, update the intersection rect.
        // Note: <body> and <html> cannot be clipped to a rect that's not also
        // the document rect, so no need to compute a new intersection.
        var doc = parent.ownerDocument;

        if (parent != doc.body && parent != doc.documentElement && parentComputedStyle.overflow != 'visible') {
          parentRect = getBoundingClientRect(parent);
        }
      } // If either of the above conditionals set a new parentRect,
      // calculate new intersection data.


      if (parentRect) {
        intersectionRect = computeRectIntersection(parentRect, intersectionRect);
      }

      if (!intersectionRect) break;
      parent = parent && getParentNode(parent);
    }

    return intersectionRect;
  };
  /**
   * Returns the root rect after being expanded by the rootMargin value.
   * @return {ClientRect} The expanded root rect.
   * @private
   */


  IntersectionObserver.prototype._getRootRect = function () {
    var rootRect;

    if (this.root) {
      rootRect = getBoundingClientRect(this.root);
    } else {
      // Use <html>/<body> instead of window since scroll bars affect size.
      var html = document.documentElement;
      var body = document.body;
      rootRect = {
        top: 0,
        left: 0,
        right: html.clientWidth || body.clientWidth,
        width: html.clientWidth || body.clientWidth,
        bottom: html.clientHeight || body.clientHeight,
        height: html.clientHeight || body.clientHeight
      };
    }

    return this._expandRectByRootMargin(rootRect);
  };
  /**
   * Accepts a rect and expands it by the rootMargin value.
   * @param {DOMRect|ClientRect} rect The rect object to expand.
   * @return {ClientRect} The expanded rect.
   * @private
   */


  IntersectionObserver.prototype._expandRectByRootMargin = function (rect) {
    var margins = this._rootMarginValues.map(function (margin, i) {
      return margin.unit == 'px' ? margin.value : margin.value * (i % 2 ? rect.width : rect.height) / 100;
    });

    var newRect = {
      top: rect.top - margins[0],
      right: rect.right + margins[1],
      bottom: rect.bottom + margins[2],
      left: rect.left - margins[3]
    };
    newRect.width = newRect.right - newRect.left;
    newRect.height = newRect.bottom - newRect.top;
    return newRect;
  };
  /**
   * Accepts an old and new entry and returns true if at least one of the
   * threshold values has been crossed.
   * @param {?IntersectionObserverEntry} oldEntry The previous entry for a
   *    particular target element or null if no previous entry exists.
   * @param {IntersectionObserverEntry} newEntry The current entry for a
   *    particular target element.
   * @return {boolean} Returns true if a any threshold has been crossed.
   * @private
   */


  IntersectionObserver.prototype._hasCrossedThreshold = function (oldEntry, newEntry) {
    // To make comparing easier, an entry that has a ratio of 0
    // but does not actually intersect is given a value of -1
    var oldRatio = oldEntry && oldEntry.isIntersecting ? oldEntry.intersectionRatio || 0 : -1;
    var newRatio = newEntry.isIntersecting ? newEntry.intersectionRatio || 0 : -1; // Ignore unchanged ratios

    if (oldRatio === newRatio) return;

    for (var i = 0; i < this.thresholds.length; i++) {
      var threshold = this.thresholds[i]; // Return true if an entry matches a threshold or if the new ratio
      // and the old ratio are on the opposite sides of a threshold.

      if (threshold == oldRatio || threshold == newRatio || threshold < oldRatio !== threshold < newRatio) {
        return true;
      }
    }
  };
  /**
   * Returns whether or not the root element is an element and is in the DOM.
   * @return {boolean} True if the root element is an element and is in the DOM.
   * @private
   */


  IntersectionObserver.prototype._rootIsInDom = function () {
    return !this.root || containsDeep(document, this.root);
  };
  /**
   * Returns whether or not the target element is a child of root.
   * @param {Element} target The target element to check.
   * @return {boolean} True if the target element is a child of root.
   * @private
   */


  IntersectionObserver.prototype._rootContainsTarget = function (target) {
    return containsDeep(this.root || document, target) && (!this.root || this.root.ownerDocument == target.ownerDocument);
  };
  /**
   * Adds the instance to the global IntersectionObserver registry if it isn't
   * already present.
   * @private
   */


  IntersectionObserver.prototype._registerInstance = function () {
    if (registry.indexOf(this) < 0) {
      registry.push(this);
    }
  };
  /**
   * Removes the instance from the global IntersectionObserver registry.
   * @private
   */


  IntersectionObserver.prototype._unregisterInstance = function () {
    var index = registry.indexOf(this);
    if (index != -1) registry.splice(index, 1);
  };
  /**
   * Returns the result of the performance.now() method or null in browsers
   * that don't support the API.
   * @return {number} The elapsed time since the page was requested.
   */


  function now() {
    return window.performance && performance.now && performance.now();
  }
  /**
   * Throttles a function and delays its execution, so it's only called at most
   * once within a given time period.
   * @param {Function} fn The function to throttle.
   * @param {number} timeout The amount of time that must pass before the
   *     function can be called again.
   * @return {Function} The throttled function.
   */


  function throttle(fn, timeout) {
    var timer = null;
    return function () {
      if (!timer) {
        timer = setTimeout(function () {
          fn();
          timer = null;
        }, timeout);
      }
    };
  }
  /**
   * Adds an event handler to a DOM node ensuring cross-browser compatibility.
   * @param {Node} node The DOM node to add the event handler to.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to add.
   * @param {boolean} opt_useCapture Optionally adds the even to the capture
   *     phase. Note: this only works in modern browsers.
   */


  function addEvent(node, event, fn, opt_useCapture) {
    if (typeof node.addEventListener == 'function') {
      node.addEventListener(event, fn, opt_useCapture || false);
    } else if (typeof node.attachEvent == 'function') {
      node.attachEvent('on' + event, fn);
    }
  }
  /**
   * Removes a previously added event handler from a DOM node.
   * @param {Node} node The DOM node to remove the event handler from.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to remove.
   * @param {boolean} opt_useCapture If the event handler was added with this
   *     flag set to true, it should be set to true here in order to remove it.
   */


  function removeEvent(node, event, fn, opt_useCapture) {
    if (typeof node.removeEventListener == 'function') {
      node.removeEventListener(event, fn, opt_useCapture || false);
    } else if (typeof node.detatchEvent == 'function') {
      node.detatchEvent('on' + event, fn);
    }
  }
  /**
   * Returns the intersection between two rect objects.
   * @param {Object} rect1 The first rect.
   * @param {Object} rect2 The second rect.
   * @return {?Object|?ClientRect} The intersection rect or undefined if no
   *     intersection is found.
   */


  function computeRectIntersection(rect1, rect2) {
    var top = Math.max(rect1.top, rect2.top);
    var bottom = Math.min(rect1.bottom, rect2.bottom);
    var left = Math.max(rect1.left, rect2.left);
    var right = Math.min(rect1.right, rect2.right);
    var width = right - left;
    var height = bottom - top;
    return width >= 0 && height >= 0 && {
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      width: width,
      height: height
    } || null;
  }
  /**
   * Shims the native getBoundingClientRect for compatibility with older IE.
   * @param {Element} el The element whose bounding rect to get.
   * @return {DOMRect|ClientRect} The (possibly shimmed) rect of the element.
   */


  function getBoundingClientRect(el) {
    var rect;

    try {
      rect = el.getBoundingClientRect();
    } catch (err) {// Ignore Windows 7 IE11 "Unspecified error"
      // https://github.com/w3c/IntersectionObserver/pull/205
    }

    if (!rect) return getEmptyRect(); // Older IE

    if (!(rect.width && rect.height)) {
      rect = {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top
      };
    }

    return rect;
  }
  /**
   * Returns an empty rect object. An empty rect is returned when an element
   * is not in the DOM.
   * @return {ClientRect} The empty rect.
   */


  function getEmptyRect() {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0
    };
  }
  /**
   * Ensure that the result has all of the necessary fields of the DOMRect.
   * Specifically this ensures that `x` and `y` fields are set.
   *
   * @param {?DOMRect|?ClientRect} rect
   * @return {?DOMRect}
   */


  function ensureDOMRect(rect) {
    // A `DOMRect` object has `x` and `y` fields.
    if (!rect || 'x' in rect) {
      return rect;
    } // A IE's `ClientRect` type does not have `x` and `y`. The same is the case
    // for internally calculated Rect objects. For the purposes of
    // `IntersectionObserver`, it's sufficient to simply mirror `left` and `top`
    // for these fields.


    return {
      top: rect.top,
      y: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      x: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height
    };
  }
  /**
   * Inverts the intersection and bounding rect from the parent (frame) BCR to
   * the local BCR space.
   * @param {DOMRect|ClientRect} parentBoundingRect The parent's bound client rect.
   * @param {DOMRect|ClientRect} parentIntersectionRect The parent's own intersection rect.
   * @return {ClientRect} The local root bounding rect for the parent's children.
   */


  function convertFromParentRect(parentBoundingRect, parentIntersectionRect) {
    var top = parentIntersectionRect.top - parentBoundingRect.top;
    var left = parentIntersectionRect.left - parentBoundingRect.left;
    return {
      top: top,
      left: left,
      height: parentIntersectionRect.height,
      width: parentIntersectionRect.width,
      bottom: top + parentIntersectionRect.height,
      right: left + parentIntersectionRect.width
    };
  }
  /**
   * Checks to see if a parent element contains a child element (including inside
   * shadow DOM).
   * @param {Node} parent The parent element.
   * @param {Node} child The child element.
   * @return {boolean} True if the parent node contains the child node.
   */


  function containsDeep(parent, child) {
    var node = child;

    while (node) {
      if (node == parent) return true;
      node = getParentNode(node);
    }

    return false;
  }
  /**
   * Gets the parent node of an element or its host element if the parent node
   * is a shadow root.
   * @param {Node} node The node whose parent to get.
   * @return {Node|null} The parent node or null if no parent exists.
   */


  function getParentNode(node) {
    var parent = node.parentNode;

    if (node.nodeType ==
    /* DOCUMENT */
    9 && node != document) {
      // If this node is a document node, look for the embedding frame.
      return getFrameElement(node);
    }

    if (parent && parent.nodeType == 11 && parent.host) {
      // If the parent is a shadow root, return the host element.
      return parent.host;
    }

    if (parent && parent.assignedSlot) {
      // If the parent is distributed in a <slot>, return the parent of a slot.
      return parent.assignedSlot.parentNode;
    }

    return parent;
  } // Exposes the constructors globally.


  window.IntersectionObserver = IntersectionObserver;
  window.IntersectionObserverEntry = IntersectionObserverEntry;
})();

(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;
          if (!f && c) return c(i, !0);
          if (u) return u(i, !0);
          var a = new Error("Cannot find module '" + i + "'");
          throw a.code = "MODULE_NOT_FOUND", a;
        }

        var p = n[i] = {
          exports: {}
        };
        e[i][0].call(p.exports, function (r) {
          var n = e[i][1][r];
          return o(n || r);
        }, p, p.exports, r, e, n, t);
      }

      return n[i].exports;
    }

    for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
      o(t[i]);
    }

    return o;
  }

  return r;
})()({
  1: [function (require, module, exports) {
    "use strict";

    var _Settings = require("./modules/Settings");

    var _Observer = require("./modules/Observer");

    var _Animations = require("./modules/Animations");

    (function (window) {
      var InitObservers = function InitObservers(_settings) {
        // override settings passed from initialization
        (0, _Settings.OverrideDefaultObserverSettings)(_settings); // scan for observable elements, attach intersection observer to each

        (0, _Observer.ObserveAIOElements)();
      };

      var Animate = function Animate(_settings) {
        // override settings passed from initialization
        (0, _Settings.OverrideDefaultAnimationSettings)(_settings); // scan for animateable elements, build the state machine, init rendering

        (0, _Animations.InitAnimations)();
      };

      window.AnimateIO = {
        InitObservers: InitObservers,
        Animate: Animate,
        observe: _Observer.ObserveElementsContinuous,
        observeOnce: _Observer.ObserveElementsOnce,
        stop: _Observer.KillAllObservers,
        reset: _Observer.RestartAnimateIO,
        restart: _Observer.RestartAnimateIO,
        destroy: _Observer.DestroyAnimateIO
      };
    })(window);
  }, {
    "./modules/Animations": 3,
    "./modules/Observer": 5,
    "./modules/Settings": 7
  }],
  2: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ObserveStateMachineObjects = exports.InitAnimationStateMachine = exports.StateMachine = void 0;

    var _Helpers = require("./Helpers");

    var _Render = require("./Render");

    var StateMachine = {
      activeCount: 0,
      elements: [],
      singleFrameElements: []
    };
    exports.StateMachine = StateMachine;

    var InitAnimationStateMachine = function InitAnimationStateMachine() {
      // filter out data-aio-<int> elements and push them to the StateMachine so that we can track them later
      populateStateMachine(); // attach an observer to all the elements added to the State Machine
      // observeStateMachineObjects(fps);
    }; // State Machine Object Template


    exports.InitAnimationStateMachine = InitAnimationStateMachine;
    var SMOTemplate = {
      id: '',
      domElement: null,
      ratio: 0,
      repeat: true,
      keyframes: []
    };

    var populateStateMachine = function populateStateMachine() {
      var _elements = document.getElementsByTagName("*");

      _toConsumableArray(_elements).forEach(function (elem, i) {
        var attributes = elem.attributes; // Match elements with the signature: data-aio-<int>
        // Example: data-aio-1000, data-aio-0

        var matched = Array.from(attributes).some(function (attr) {
          return /^data-aio--?[0-9]+/g.test(attr.name);
        });

        if (matched) {
          var keyframes = Array.from(attributes).filter(function (attr) {
            return /^data-aio--?[0-9]+/g.test(attr.name);
          });
          var id = "aio-pl-".concat(i);
          elem.setAttribute('data-aio-pl-id', id);

          var entry = _objectSpread({}, SMOTemplate);

          entry.id = id;
          entry.repeat = (0, _Helpers.GetAttrVal)(elem, 'data-aio-repeat', true);
          entry.domElement = elem;
          entry.keyframes = processKeyFrames(keyframes, elem);

          if (keyframes.length == 1) {
            StateMachine.singleFrameElements.push(entry);
          } else {
            StateMachine.elements.push(entry);
          }
        }
      });
    };

    var processKeyFrames = function processKeyFrames(kf, elem) {
      var frames = [];
      kf.forEach(function (f, i) {
        var _props = {};
        f.value.trim().split(";").forEach(function (p) {
          if (p.length > 0) {
            var key = p.split(":")[0].trim();
            var val = p.split(":")[1].trim();
            var numbers = []; //Now parse ANY number inside this string and create a format string.

            val = val.replace(/[\-+]?[\d]*\.?[\d]+/g, function (n) {
              numbers.push(+n);
              return '{?}';
            }); //Add the formatstring as first value.

            numbers.unshift(val);
            _props[key] = {
              value: numbers
            };
          }
        });

        var _offset = parseInt(f.name.replace('data-aio-', ''));

        frames.push({
          offset: _offset,
          absOffset: _offset,
          props: _props
        });
        elem.setAttribute("data-kf-".concat(i), _offset);
      }); //convert offset to absolute

      if (settings.mode == "relative") {
        frames.forEach(function (f, i) {
          var offset = elem.offsetTop + f.offset - window.innerHeight;
          f.absOffset = offset;
          elem.setAttribute("data-kf-".concat(i), offset);
        });
      }

      frames.sort(function (a, b) {
        return a.absOffset > b.absOffset ? 1 : b.absOffset > a.absOffset ? -1 : 0;
      }); // handle missing props between frames

      var frameIndex = 0;
      var propList = {}; //iterate from left to right

      for (; frameIndex < frames.length; frameIndex++) {
        _fillPropForFrame(frames[frameIndex], propList);
      } //iterate from right to left


      propList = {};
      frameIndex--;

      for (; frameIndex >= 0; frameIndex--) {
        _fillPropForFrame(frames[frameIndex], propList);
      }

      return frames;
    };

    var _fillPropForFrame = function _fillPropForFrame(frame, propList) {
      var key; //For each key frame iterate over all right hand properties and assign them,
      //but only if the current key frame doesn't have the property by itself

      for (key in propList) {
        //The current frame misses this property, so assign it.
        if (!Object.prototype.hasOwnProperty.call(frame.props, key)) {
          frame.props[key] = propList[key];
        }
      } //Iterate over all props of the current frame and collect them


      for (key in frame.props) {
        propList[key] = frame.props[key];
      }
    };

    var ObserveStateMachineObjects = function ObserveStateMachineObjects() {
      console.log(StateMachine);

      if (StateMachine.elements.length > 0) {
        var observerSettings = {
          root: document,
          rootMargin: 0,
          threshold: 0
        }; // init observer

        var observer = new IntersectionObserver(function (entries, observerSettings) {
          //console.log(entries)
          entries.forEach(function (entry) {
            var elem = entry.target;
            var aioPlId = elem.getAttribute('data-aio-pl-id');
            var stateMachineObject = StateMachine.elements.filter(function (o) {
              return o.id == aioPlId;
            })[0];
            var intersected = false;
            var ratio = entry.intersectionRatio;
            stateMachineObject.ratio = ratio;
            elem.setAttribute('data-ratio', ratio);

            if (ratio > 0) {
              intersected = true;
              StateMachine.activeCount++;
            }

            if (ratio == 0 && intersected) {
              StateMachine.activeCount--;

              if (!stateMachineObject.repeat) {
                observer.unobserve(elem);
                var smoIndex = StateMachine.elements.findIndex(function (o) {
                  return o.id == aioPlId;
                });
                StateMachine.elements.splice(smoIndex, 1);
              }
            }
          });
        });
        StateMachine.elements.forEach(function (elem) {
          observer.observe(elem.domElement);
        }); // init render

        var useFps = true;

        if (fps != null) {
          var num = parseFloat(fps);
          useFps = !isNaN(num);
        }

        if (useFps) {
          (function animationTimeoutUpdate() {
            (0, _Render.Render)();
            setTimeout(function () {
              requestAnimationFrame(animationTimeoutUpdate);
            }, 1000 / fps);
          })();
        } else {
          (function animationUpdate() {
            (0, _Render.Render)();
            requestAnimationFrame(animationUpdate);
          })();
        }
      }
    };

    exports.ObserveStateMachineObjects = ObserveStateMachineObjects;
  }, {
    "./Helpers": 4,
    "./Render": 6
  }],
  3: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.InitAnimations = void 0;

    var _AnimationStateMachine = require("./AnimationStateMachine");

    var _Helpers = require("./Helpers");

    var _Settings = require("./Settings");

    var InitAnimations = function InitAnimations() {
      //scan for animateable elements, build the state machine
      (0, _AnimationStateMachine.InitAnimationStateMachine)(); // init rendering for all the elements

      (0, _AnimationStateMachine.ObserveStateMachineObjects)();

      if (_Settings.ObserverSettings.gridHelper) {
        setTimeout(function () {
          return (0, _Helpers.DrawGrid)();
        }, 1000);
      }
    };

    exports.InitAnimations = InitAnimations;
  }, {
    "./AnimationStateMachine": 2,
    "./Helpers": 4,
    "./Settings": 7
  }],
  4: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.DrawGrid = exports.AttrToNum = exports.GetAttrVal = void 0;

    var GetAttrVal = function GetAttrVal(elem, attr, defaultValue) {
      var val = defaultValue;

      if (elem.hasAttribute(attr)) {
        var attrval = elem.getAttribute(attr);

        if (attrval != null) {
          val = attrval;
        }
      }

      return val;
    };

    exports.GetAttrVal = GetAttrVal;

    var AttrToNum = function AttrToNum(elem, attr, defaultValue) {
      var val = GetAttrVal(elem, attr, defaultValue);
      var num = parseInt(val);
      return Number.isNaN(num) ? defaultValue : num;
    };

    exports.AttrToNum = AttrToNum;

    var DrawGrid = function DrawGrid() {
      var gridContainer = document.createElement('div');
      gridContainer.id = "aio-grid-container";
      var h = document.documentElement.scrollHeight;

      for (var i = 0; i < h; i += 100) {
        var div = document.createElement('div');
        div.className = "aio-row";
        div.innerHTML = "<div class=\"num\">".concat(i, "</div><div class=\"num\">").concat(i, "</div>");
        gridContainer.appendChild(div);
      }

      document.body.appendChild(gridContainer);
    };

    exports.DrawGrid = DrawGrid;
  }, {}],
  5: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.RestartAnimateIO = exports.DestroyAnimateIO = exports.ResetAnimateIO = exports.KillAllObservers = exports.ObserveElementsContinuous = exports.ObserveElementsOnce = exports.ObserveAIOElements = void 0;

    var _Settings = require("./Settings");

    var _Helpers = require("./Helpers");

    var elements = null;
    var ObserverList = [];

    var ObserveAIOElements = function ObserveAIOElements() {
      elements = document.querySelectorAll("[".concat(_Settings.ObserverSettings.observableAttrName, "]"));
      elements.forEach(function (elem, i) {
        elem.setAttribute('data-aio-id', "aio_auto_".concat(i));

        var repeat = elem.hasAttribute('data-aio-repeat') || _Settings.ObserverSettings.repeat;

        var delay = (0, _Helpers.AttrToNum)(elem, 'data-aio-delay', _Settings.ObserverSettings.delay);
        var offsetTop = (0, _Helpers.GetAttrVal)(elem, 'data-aio-offset-top', _Settings.ObserverSettings.rootMargin.split(" ")[0]);
        var offsetRgt = (0, _Helpers.GetAttrVal)(elem, 'data-aio-offset-right', _Settings.ObserverSettings.rootMargin.split(" ")[1]);
        var offsetBtm = (0, _Helpers.GetAttrVal)(elem, 'data-aio-offset-bottom', _Settings.ObserverSettings.rootMargin.split(" ")[2]);
        var offsetLft = (0, _Helpers.GetAttrVal)(elem, 'data-aio-offset-left', _Settings.ObserverSettings.rootMargin.split(" ")[3]);
        var rootMargin = "".concat(offsetTop, " ").concat(offsetRgt, " ").concat(offsetBtm, " ").concat(offsetLft);

        if (elem.hasAttribute("data-aio-offset")) {
          var offsetVal = elem.getAttribute("data-aio-offset");

          if (offsetVal != null && offsetVal.length > 0) {
            rootMargin = offsetVal;
          }
        }

        var intersected = false;
        var classes = [];
        var aioType = elem.getAttribute(_Settings.ObserverSettings.observableAttrName);

        if (aioType.length > 0) {
          classes.push("aio-".concat(aioType));
        }

        var intersectionsettings = {
          root: _Settings.ObserverSettings.root,
          rootMargin: rootMargin,
          threshold: _Settings.ObserverSettings.threshold
        };
        var observer = new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            var ratio = entry.intersectionRatio;
            var entryTimeOut = 0;

            if (ratio > 0) {
              intersected = true;
              entryTimeOut = setTimeout(function () {
                entry.target.classList.remove(_Settings.ObserverSettings.exitIntersectionClassName);
                entry.target.classList.add(_Settings.ObserverSettings.enterIntersectionClassName);
                classes.forEach(function (c) {
                  entry.target.classList.add(c);
                });
              }, delay);
            }

            if (ratio == 0 && repeat) {
              clearTimeout(entryTimeOut);
              entry.target.classList.remove(_Settings.ObserverSettings.enterIntersectionClassName);
              classes.forEach(function (c) {
                entry.target.classList.remove(c);
              });
              entry.target.classList.add(_Settings.ObserverSettings.exitIntersectionClassName);
            }

            if (ratio == 0 && !repeat && intersected) {
              observer.unobserve(elem);
              observer.disconnect();
            }
          });
        }, intersectionsettings);
        observer.observe(elem);
        ObserverList.push(observer);
      });
    };

    exports.ObserveAIOElements = ObserveAIOElements;

    var ObserveElements = function ObserveElements(target, options, callback, repeat) {
      var defaultOptions = _objectSpread({
        root: document,
        rootMargin: 0,
        threshold: 0
      }, options);

      var observer = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          callback(entry);
          var ratio = entry.intersectionRatio;

          if (ratio != 0) {
            if (entry.in) entry.in();

            if (!repeat) {
              observer.unobserve(entry.target);
              observer.disconnect();
            }
          } else {
            if (entry.out) entry.out();
          }
        });
      }, defaultOptions);

      if (typeof target == "string" && target.trim().length > 0) {
        document.querySelectorAll(target).forEach(function (elem) {
          return observer.observe(elem);
        });
      } else if (target instanceof Element) {
        observer.observe(target);
      } else if (NodeList.prototype.isPrototypeOf(target)) {
        target.forEach(function (elem) {
          return observer.observe(elem);
        });
      } else if (HTMLCollection.prototype.isPrototypeOf(target)) {
        _toConsumableArray(target).forEach(function (elem) {
          return observer.observe(elem);
        });
      } else {
        console.error("Target element: \"".concat(target, "\" not found"));
      }
    };

    var ObserveElementsOnce = function ObserveElementsOnce(target, options, callback) {
      ObserveElements(target, options, callback, false);
    };

    exports.ObserveElementsOnce = ObserveElementsOnce;

    var ObserveElementsContinuous = function ObserveElementsContinuous(target, options, callback) {
      ObserveElements(target, options, callback, true);
    };

    exports.ObserveElementsContinuous = ObserveElementsContinuous;

    var KillAllObservers = function KillAllObservers() {
      ObserverList.forEach(function (o) {
        o.disconnect();
      });
      ObserverList = [];
    };

    exports.KillAllObservers = KillAllObservers;

    var ResetAnimateIO = function ResetAnimateIO() {
      killAllObservers();

      var _elems = document.querySelectorAll("[".concat(_Settings.ObserverSettings.observableAttrName, "]"));

      _elems.forEach(function (elem, i) {
        elem.classList.remove(Settings.enterIntersectionClassName);
        var aioType = elem.getAttribute(_Settings.ObserverSettings.observableAttrName);

        if (aioType.length > 0) {
          elem.classList.remove("aio-".concat(aioType));
        }
      });
    };

    exports.ResetAnimateIO = ResetAnimateIO;

    var DestroyAnimateIO = function DestroyAnimateIO() {
      resetAnimateIO();

      var _elems = document.querySelectorAll("[".concat(_Settings.ObserverSettings.observableAttrName, "]"));

      _elems.forEach(function (elem, i) {
        var attributes = elem.attributes;
        Array.from(attributes).forEach(function (attr) {
          if (attr.name.indexOf(_Settings.ObserverSettings.observableAttrName) > -1) {
            elem.removeAttribute(attr.name);
          }
        });
      });
    };

    exports.DestroyAnimateIO = DestroyAnimateIO;

    var RestartAnimateIO = function RestartAnimateIO() {
      resetAnimateIO();
      main();
    };

    exports.RestartAnimateIO = RestartAnimateIO;
  }, {
    "./Helpers": 4,
    "./Settings": 7
  }],
  6: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Render = void 0;

    var _AnimationStateMachine = require("./AnimationStateMachine");

    var scrollTop = 0;
    var scrollTopPrev = -1;
    var doc = document.documentElement;

    var Render = function Render() {
      if (_AnimationStateMachine.StateMachine.activeCount == 0) return;
      scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
      if (scrollTop == scrollTopPrev) return;
      scrollTopPrev = scrollTop;
      document.body.setAttribute("data-scroll-top", scrollTop);

      var entries = _AnimationStateMachine.StateMachine.elements.filter(function (entry) {
        return entry.ratio > 0;
      });

      entries.forEach(function (entry) {
        var frames = entry.keyframes;
        var elem = entry.domElement;
        var elemTop = elem.offsetTop; //convert offset to absolute

        if (settings.mode == "relative") {
          frames.forEach(function (f, i) {
            var offset = elemTop + f.offset - window.innerHeight;
            f.absOffset = offset;
            elem.setAttribute("data-kf-".concat(i), offset);
          });
        }

        var _loop = function _loop(i) {
          var curFrame = frames[i];
          var nxtFrame = frames[i + 1];
          var frame1_top = curFrame.absOffset;
          var frame2_top = nxtFrame.absOffset;
          var isBefore = scrollTop < frame1_top;
          var isAfter = scrollTop > frame2_top;

          if (isBefore || isAfter) {
            //console.log(isBefore, isAfter);
            var requiredFrame = isBefore ? curFrame : nxtFrame;
            Object.keys(requiredFrame.props).forEach(function (key, index) {
              var prop = requiredFrame.props[key];

              var value = _interpolateString(prop.value);

              setStyle(elem, key, value);
            });
            return {
              v: void 0
            };
          }

          var progress = (scrollTop - frame1_top) / (frame2_top - frame1_top);
          Object.keys(curFrame.props).forEach(function (key) {
            var interpolatedValue = _calcInterpolation(curFrame.props[key].value, nxtFrame.props[key].value, progress);

            var value = _interpolateString(interpolatedValue);

            setStyle(elem, key, value);
          });
        };

        for (var i = 0; i < frames.length - 1; i++) {
          var _ret = _loop(i);

          if (_typeof(_ret) === "object") return _ret.v;
        }
      });
    };

    exports.Render = Render;

    var _calcInterpolation = function _calcInterpolation(val1, val2, progress) {
      var valueIndex;
      var val1Length = val1.length; //They both need to have the same length

      if (val1Length !== val2.length) {
        throw 'Can\'t interpolate between "' + val1[0] + '" and "' + val2[0] + '"';
      } //Add the format string as first element.


      var interpolated = [val1[0]];
      valueIndex = 1;

      for (; valueIndex < val1Length; valueIndex++) {
        //That's the line where the two numbers are actually interpolated.
        interpolated[valueIndex] = val1[valueIndex] + (val2[valueIndex] - val1[valueIndex]) * progress;
      }

      return interpolated;
    };

    var _interpolateString = function _interpolateString(val) {
      var i = 1;
      return val[0].replace(/\{\?\}/g, function () {
        return val[i++];
      });
    };

    var setStyle = function setStyle(elem, key, value) {
      var style = elem.style; // Extract "-x", "-m" from string "abc-xyz-mno" 

      var match = key.match(/-./g);

      if (match != null) {
        // convert font-size to fontSize
        var uprCs = match[0].toUpperCase();
        var prop = key.replace(match[0], uprCs).replace('-', '');
        style[prop] = value;
      } else {
        style[key] = value;
      }
    };
  }, {
    "./AnimationStateMachine": 2
  }],
  7: [function (require, module, exports) {
    "use strict";

    var _DefaultObserverSetti;

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.OverrideDefaultAnimationSettings = exports.AnimationSettings = exports.OverrideDefaultObserverSettings = exports.ObserverSettings = void 0;
    var DefaultObserverSettings = (_DefaultObserverSetti = {
      delay: 0,
      offset: 0,
      observableAttrName: "data-aiobserve",
      enterIntersectionClassName: "aio-enter",
      exitIntersectionClassName: "aio-exit",
      repeat: false,
      threshold: 0,
      root: document,
      rootMargin: '0px 0px 0px 0px'
    }, _defineProperty(_DefaultObserverSetti, "threshold", 0), _defineProperty(_DefaultObserverSetti, "trackMutations", true), _defineProperty(_DefaultObserverSetti, "requiredWidth", 1025), _DefaultObserverSetti);
    var ObserverSettings = null;
    exports.ObserverSettings = ObserverSettings;

    var OverrideDefaultObserverSettings = function OverrideDefaultObserverSettings(_settings) {
      exports.ObserverSettings = ObserverSettings = _objectSpread(_objectSpread({}, DefaultObserverSettings), _settings);
      return ObserverSettings;
    };

    exports.OverrideDefaultObserverSettings = OverrideDefaultObserverSettings;
    var DefaultAnimationSettings = {
      gridHelper: false,
      mode: 'relative',
      fps: null
    };
    var AnimationSettings = null;
    exports.AnimationSettings = AnimationSettings;

    var OverrideDefaultAnimationSettings = function OverrideDefaultAnimationSettings(_settings) {
      exports.AnimationSettings = AnimationSettings = _objectSpread(_objectSpread({}, DefaultAnimationSettings), _settings);
      return AnimationSettings;
    };

    exports.OverrideDefaultAnimationSettings = OverrideDefaultAnimationSettings;
  }, {}]
}, {}, [1]);