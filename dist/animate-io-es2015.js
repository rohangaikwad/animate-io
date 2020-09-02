"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

(function (window) {
  var observers = [];

  var defaultSettings = _defineProperty({
    delay: 0,
    offset: 0,
    enterIntersectionClassName: "aio-enter",
    exitIntersectionClassName: "aio-exit",
    repeat: false,
    threshold: 0,
    root: document,
    rootMargin: '0px 0px 0px 0px'
  }, "threshold", 0);

  var settings = {};
  var elements = null;

  var getAttrVal = function getAttrVal(elem, attr, defaultValue) {
    var val = defaultValue;

    if (elem.hasAttribute(attr)) {
      var attrval = elem.getAttribute(attr);

      if (attrval != null) {
        val = attrval;
      }
    }

    return val;
  };

  var attrToNum = function attrToNum(elem, attr, defaultValue) {
    var val = getAttrVal(elem, attr, defaultValue);
    var num = parseInt(val);
    return Number.isNaN(num) ? defaultValue : num;
  };

  var main = function main(_settings) {
    settings = _objectSpread(_objectSpread({}, defaultSettings), _settings);
    console.log("hello");
    elements = document.querySelectorAll('[data-aio]');
    elements.forEach(function (elem, i) {
      elem.setAttribute('data-aio-id', "aio_auto_".concat(i));
      var repeat = elem.hasAttribute('data-aio-repeat') || settings.repeat;
      var delay = attrToNum(elem, 'data-aio-delay', settings.delay);
      var offsetTop = getAttrVal(elem, 'data-aio-offset-top', settings.rootMargin.split(" ")[0]);
      var offsetRgt = getAttrVal(elem, 'data-aio-offset-right', settings.rootMargin.split(" ")[1]);
      var offsetBtm = getAttrVal(elem, 'data-aio-offset-bottom', settings.rootMargin.split(" ")[2]);
      var offsetLft = getAttrVal(elem, 'data-aio-offset-left', settings.rootMargin.split(" ")[3]);
      var rootMargin = "".concat(offsetTop, " ").concat(offsetRgt, " ").concat(offsetBtm, " ").concat(offsetLft);

      if (elem.hasAttribute("data-aio-offset")) {
        var offsetVal = elem.getAttribute("data-aio-offset");

        if (offsetVal != null && offsetVal.length > 0) {
          rootMargin = offsetVal;
        }
      }

      var intersected = false;
      var classes = [settings.enterIntersectionClassName];
      var aioType = elem.getAttribute('data-aio');

      if (aioType.length > 0) {
        classes.push("aio-".concat(aioType));
      }

      var intersectionsettings = {
        root: settings.root,
        rootMargin: rootMargin,
        threshold: settings.threshold
      };
      var observer = new IntersectionObserver(function (entries, intersectionsettings) {
        entries.forEach(function (entry) {
          var ratio = entry.intersectionRatio;
          var entryTimeOut = 0;

          if (ratio > 0) {
            intersected = true;
            entryTimeOut = setTimeout(function () {
              classes.forEach(function (c) {
                entry.target.classList.add(c);
              });
            }, delay);
          }

          if (ratio == 0 && repeat) {
            clearTimeout(entryTimeOut);
            classes.forEach(function (c) {
              entry.target.classList.remove(c);
            });
          }

          if (ratio == 0 && !repeat && intersected) {
            observer.unobserve(elem);
            observer.disconnect();
          }
        });
      });
      observer.observe(elem);
      observers.push(observer);
    });
  };

  var manualObserver = function manualObserver(target, options, callback, repeat) {
    var defaultOptions = _objectSpread({
      root: document,
      rootMargin: 0,
      threshold: 0
    }, options);

    var observer = new IntersectionObserver(function (entries, defaultOptions) {
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
    });

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

  var manualObserverOnce = function manualObserverOnce(target, options, callback) {
    manualObserver(target, options, callback, false);
  };

  var manualObserverMany = function manualObserverMany(target, options, callback) {
    manualObserver(target, options, callback, true);
  };

  var killAllObservers = function killAllObservers() {
    observers.forEach(function (o) {
      o.disconnect();
    });
    observers = [];
  };

  var resetAnimateIO = function resetAnimateIO() {
    killAllObservers();

    var _elems = document.querySelectorAll('[data-aio]');

    _elems.forEach(function (elem, i) {
      elem.classList.remove(settings.enterIntersectionClassName);
      var aioType = elem.getAttribute('data-aio');

      if (aioType.length > 0) {
        elem.classList.remove("aio-".concat(aioType));
      }
    });
  };

  var destroyAnimateIO = function destroyAnimateIO() {
    resetAnimateIO();

    var _elems = document.querySelectorAll('[data-aio]');

    _elems.forEach(function (elem, i) {
      var attributes = elem.attributes;
      Array.from(attributes).forEach(function (attr) {
        if (attr.name.indexOf("data-aio") > -1) {
          elem.removeAttribute(attr.name);
        }
      });
    });
  };

  var restartAnimateIO = function restartAnimateIO() {
    resetAnimateIO();
    main();
  };

  window.AnimateIO = {
    init: main,
    observe: manualObserverMany,
    observeOnce: manualObserverOnce,
    end: killAllObservers,
    reset: resetAnimateIO,
    restart: restartAnimateIO,
    destroy: destroyAnimateIO
  };
})(window);

console.log('yo');