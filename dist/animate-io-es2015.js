"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

(function (window) {
  var observers = [];

  var defaultSettings = _defineProperty({
    gridHelper: false,
    mode: 'relative',
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

  var stateMachine = {
    activeCount: 0,
    elements: [],
    singleFrameElements: []
  };

  var buildParallaxStateMachine = function buildParallaxStateMachine() {
    var entryTemplate = {
      id: '',
      domElement: null,
      ratio: 0,
      repeat: true,
      keyframes: []
    };

    var _elements = document.getElementsByTagName("*");

    _toConsumableArray(_elements).forEach(function (elem, i) {
      var attributes = elem.attributes;
      var matched = Array.from(attributes).some(function (attr) {
        return /^data-aio--?[0-9]+/g.test(attr.name);
      });

      if (matched) {
        var keyframes = Array.from(attributes).filter(function (attr) {
          return /^data-aio--?[0-9]+/g.test(attr.name);
        });
        var id = "aio-pl-".concat(i);
        elem.setAttribute('data-aio-pl-id', id);

        var entry = _objectSpread({}, entryTemplate);

        entry.id = id;
        entry.repeat = getAttrVal(elem, 'data-aio-repeat', true);
        entry.domElement = elem;
        entry.keyframes = processKeyFrames(keyframes, elem);

        if (keyframes.length == 1) {
          stateMachine.singleFrameElements.push(entry);
        } else {
          stateMachine.elements.push(entry);
        }
      }
    });

    console.log(stateMachine);

    if (stateMachine.elements.length > 0) {
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
          var stateMachineObject = stateMachine.elements.filter(function (o) {
            return o.id == aioPlId;
          })[0];
          var intersected = false;
          var ratio = entry.intersectionRatio;
          stateMachineObject.ratio = ratio;
          elem.setAttribute('data-ratio', ratio);

          if (ratio > 0) {
            intersected = true;
            stateMachine.activeCount++;
          }

          if (ratio == 0 && intersected) {
            stateMachine.activeCount--;

            if (!stateMachineObject.repeat) {
              observer.unobserve(elem);
              var smoIndex = stateMachine.elements.findIndex(function (o) {
                return o.id == aioPlId;
              });
              stateMachine.elements.splice(smoIndex, 1);
            }
          }
        });
      });
      stateMachine.elements.forEach(function (elem) {
        observer.observe(elem.domElement);
      }); // init render

      var fps = 60;

      (function animationUpdate() {
        render(); //setTimeout(() => {

        requestAnimationFrame(animationUpdate); //}, 1000 / fps);
      })();
    }
  };

  var doc = document.documentElement;
  var scrollTop = 0,
      scrollTopPrev = -1;

  var render = function render() {
    if (stateMachine.activeCount == 0) return;
    scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    if (scrollTop == scrollTopPrev) return;
    scrollTopPrev = scrollTop;
    document.body.setAttribute("data-scroll-top", scrollTop);
    var entries = stateMachine.elements.filter(function (entry) {
      return entry.ratio > 0;
    });
    entries.forEach(function (entry) {
      var frames = entry.keyframes;
      var elem = entry.domElement;
      var elemTop = elem.offsetTop; //let elemBtm = elemTop + elem.getBoundingClientRect().height;
      //convert offset to absolute

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
    var style = elem.style;
    var match = key.match(/-./g);

    if (match != null) {
      var uprCs = match[0].toUpperCase();
      var prop = key.replace(match[0], uprCs).replace('-', '');
      style[prop] = value;
    } else {
      style[key] = value;
    }
  };

  var main = function main(_settings) {
    settings = _objectSpread(_objectSpread({}, defaultSettings), _settings);
    buildParallaxStateMachine();
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

    if (settings.gridHelper) {
      setTimeout(function () {
        return drawGrid();
      }, 1000);
    }
  };

  var drawGrid = function drawGrid() {
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