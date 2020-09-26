"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

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

        (0, _Observer.InitAIObservers)();
      };

      var Animate = function Animate(_settings) {
        // override settings passed from initialization
        (0, _Settings.OverrideDefaultAnimationSettings)(_settings); // scan for animateable elements, build the state machine, init rendering

        (0, _Animations.InitAnimations)();
      };

      window.AnimateIO = {
        InitObservers: InitObservers,
        Observe: _Observer.ObserveElementsContinuous,
        ObserveOnce: _Observer.ObserveElementsOnce,
        StopObservers: _Observer.KillAllObservers,
        DestroyObservers: _Observer.DestroyAnimateIO,
        RestartObservers: _Observer.RestartAnimateIO,
        Animate: Animate,
        AnimateEnd: _Animations.KillAnimateInstance,
        AnimateRestart: _Animations.RestartAnimateInstance
      };
    })(window);
  }, {
    "./modules/Animations": 3,
    "./modules/Observer": 7,
    "./modules/Settings": 9
  }],
  2: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ResetStateMachine = exports.StopAnimationObserver = exports.ObserveStateMachineObjects = exports.InitiateAnimationObserver = exports.UpdateStateMachine = exports.InitAnimationStateMachine = exports.StateMachine = void 0;

    var _Constants = require("./Constants");

    var _Render = require("./Render");

    var _Settings = require("./Settings");

    var StateMachine = {
      activeCount: 0,
      elements: [],
      singleFrameElements: []
    };
    exports.StateMachine = StateMachine;

    var InitAnimationStateMachine = function InitAnimationStateMachine() {
      // filter out data-aio-<int> elements and push them to the StateMachine so that we can track them later
      populateStateMachine(function (count) {
        console.log("".concat(count, " animateable elements found"));
      });
    };

    exports.InitAnimationStateMachine = InitAnimationStateMachine;

    var UpdateStateMachine = function UpdateStateMachine() {
      var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      populateStateMachine(function (count) {
        console.log("".concat(count, " new animateable elements found"));
        ObserveStateMachineObjects(); // Wait for observers to get attached to new elements

        setTimeout(function () {
          return (0, _Render.ForceRenderLoop)();
        }, 100);
      });
    }; // State Machine Object Template


    exports.UpdateStateMachine = UpdateStateMachine;
    var SMOTemplate = {
      id: '',
      domElement: null,
      ratio: 0,
      repeat: true,
      keyframes: [],
      observerAttached: false
    };
    var populateCounter = 0; // use this counter to generate unique ids for elements

    var populateStateMachine = function populateStateMachine(done) {
      var AllElements = document.getElementsByTagName("*"); // Filter elements with the signature: data-aio-<int>
      // Example: data-aio-1000, data-aio-0

      var AIOElements = _toConsumableArray(AllElements).filter(function (elem) {
        var attributes = Object.entries(elem.attributes).map(function (a) {
          return a[1];
        });
        return attributes.some(function (f) {
          return /^data-aio--?[0-9]+/g.test(f.name);
        });
      }); // remove elements which have already been added & tracked inside animation state machien list


      var _elements = AIOElements.filter(function (elem) {
        return !elem.hasAttribute(_Constants.SMO_ID_ATTR_NAME);
      });

      _elements.forEach(function (elem, i) {
        var attributes = elem.attributes;
        var keyframes = Array.from(attributes).filter(function (attr) {
          return /^data-aio--?[0-9]+/g.test(attr.name);
        });
        var id = "aio-pl-".concat(++populateCounter, "-").concat(i);
        elem.setAttribute(_Constants.SMO_ID_ATTR_NAME, id);

        var entry = _objectSpread({}, SMOTemplate);

        entry.id = id;
        entry.repeat = elem.hasAttribute('data-aio-repeat');
        entry.domElement = elem;
        entry.keyframes = processKeyFrames(keyframes, elem);
        entry.observerAttached = false;

        if (keyframes.length == 1) {
          StateMachine.singleFrameElements.push(entry);
        } else {
          StateMachine.elements.push(entry);
        }
      });

      done(_elements.length);
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

      if (_Settings.AnimationSettings.mode == "relative") {
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

    var AnimationObserver = null;

    var InitiateAnimationObserver = function InitiateAnimationObserver() {
      var observerSettings = {
        root: null,
        rootMargin: '0px',
        threshold: 0
      }; // init observer

      AnimationObserver = new IntersectionObserver(function (entries, observer) {
        //console.log(entries)
        entries.forEach(function (entry) {
          var elem = entry.target;
          var aioPlId = elem.getAttribute(_Constants.SMO_ID_ATTR_NAME);
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
      }, observerSettings);
    };

    exports.InitiateAnimationObserver = InitiateAnimationObserver;

    var ObserveStateMachineObjects = function ObserveStateMachineObjects() {
      if (StateMachine.elements.length > 0) {
        var newStateMachineElements = StateMachine.elements.filter(function (elem) {
          return !elem.observerAttached;
        });
        newStateMachineElements.forEach(function (elem) {
          AnimationObserver.observe(elem.domElement);
          elem.observerAttached = true;
        });
      }
    };

    exports.ObserveStateMachineObjects = ObserveStateMachineObjects;

    var StopAnimationObserver = function StopAnimationObserver() {
      AnimationObserver.disconnect();
    };

    exports.StopAnimationObserver = StopAnimationObserver;

    var RemoveSMOAttributes = function RemoveSMOAttributes() {
      var StateMachineObjects = [].concat(_toConsumableArray(StateMachine.elements), _toConsumableArray(StateMachine.singleFrameElements));
      StateMachineObjects.forEach(function (smo) {
        smo.domElement.removeAttribute(_Constants.SMO_ID_ATTR_NAME);
      });
    };

    var ResetStateMachine = function ResetStateMachine() {
      RemoveSMOAttributes();
      StateMachine.activeCount = 0;
      StateMachine.elements = [];
      StateMachine.singleFrameElements = [];
    };

    exports.ResetStateMachine = ResetStateMachine;
  }, {
    "./Constants": 4,
    "./Render": 8,
    "./Settings": 9
  }],
  3: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.RestartAnimateInstance = exports.KillAnimateInstance = exports.InitAnimations = void 0;

    var _AnimationStateMachine = require("./AnimationStateMachine");

    var _Helpers = require("./Helpers");

    var _Mutations = require("./Mutations");

    var _Render = require("./Render");

    var _Settings = require("./Settings");

    var AnimationsInitialized = false;

    var InitAnimations = function InitAnimations() {
      if (AnimationsInitialized) {
        console.error('AnimateIO.Animate() already initialized. To start a new instance, please stop the current animations instance using:\nAnimateIO.StopAnimations();');
      } // Check if browser dimensions are correct


      var canInitialize = (0, _Helpers.QueryMedia)("(min-width: ".concat(_Settings.AnimationSettings.deactivateBelow, "px)"));

      if (!canInitialize) {
        console.log("AnimateIO.Animate() can't initialize since the screen width is less than ".concat(_Settings.AnimationSettings.deactivateBelow));
        return;
      } // Initiate animation observer


      (0, _AnimationStateMachine.InitiateAnimationObserver)(); //scan for animateable elements, build the state machine

      (0, _AnimationStateMachine.InitAnimationStateMachine)(); // attach an observer to all the elements added to the State Machine

      (0, _AnimationStateMachine.ObserveStateMachineObjects)(); // init rendering for all the elements

      (0, _Render.InitRenderer)(); // look for new animateable objects with the signature data-aio-<int>
      // start looking for new elements after an arbitrary delay of 2 seconds

      if (_Settings.AnimationSettings.trackMutations) {
        setTimeout(function () {
          return AddNewElementsToStateMachine();
        }, _Settings.AnimationSettings.mutationWatchDelay);
      } // show a helper grid and markers for where an animation will start and end


      if (_Settings.AnimationSettings.gridHelper) {
        setTimeout(function () {
          return (0, _Helpers.DrawGrid)();
        }, 1000);
      }

      AnimationsInitialized = true; // Check for browser resolution changes    

      WatchBrowserResize();
    };

    exports.InitAnimations = InitAnimations;

    var AddNewElementsToStateMachine = function AddNewElementsToStateMachine() {
      (0, _Mutations.AddMutationListener)({
        name: 'animations_listener',
        callback: function callback(mutations) {
          (0, _AnimationStateMachine.UpdateStateMachine)();
        }
      });
    };

    var WatchBrowserResize = function WatchBrowserResize() {
      (0, _Helpers.QueryMedia)("(min-width: ".concat(_Settings.AnimationSettings.deactivateBelow, "px)"), function (response) {
        if (response.matches) {
          // Start animations if not already initialized
          if (!AnimationsInitialized) {
            if (response.remove != null) {
              response.remove();
              console.log("Restarting AnimateIO.Animate as browser width is >= ".concat(_Settings.AnimationSettings.deactivateBelow, "px"));
              InitAnimations();
            }
          }
        } else {
          // stop the animations if browser window shrinks below defined width
          if (AnimationsInitialized) {
            console.log("Stopping AnimateIO.Animate as browser width is < ".concat(_Settings.AnimationSettings.deactivateBelow, "px"));
            KillAnimateInstance();
          }
        }
      });
    };

    var KillAnimateInstance = function KillAnimateInstance() {
      // stop rendering
      (0, _Render.StopRenderLoop)(); // Stop animation intersection observer

      (0, _AnimationStateMachine.StopAnimationObserver)(); // disconnect mutation observer

      (0, _Mutations.ResetMutationObserver)(); // reset state machine & remove state machine id attribute

      (0, _AnimationStateMachine.ResetStateMachine)();
      AnimationsInitialized = false;
    };

    exports.KillAnimateInstance = KillAnimateInstance;

    var RestartAnimateInstance = function RestartAnimateInstance() {
      KillAnimateInstance();
      InitAnimations();
    };

    exports.RestartAnimateInstance = RestartAnimateInstance;
  }, {
    "./AnimationStateMachine": 2,
    "./Helpers": 5,
    "./Mutations": 6,
    "./Render": 8,
    "./Settings": 9
  }],
  4: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SMO_ID_ATTR_NAME = void 0;
    var SMO_ID_ATTR_NAME = 'data-aio-smo-id';
    exports.SMO_ID_ATTR_NAME = SMO_ID_ATTR_NAME;
  }, {}],
  5: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.QueryMedia = exports.RemoveClasses = exports.AddClasses = exports.DrawGrid = exports.AttrToNum = exports.GetAttrVal = void 0;

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

    var AddClasses = function AddClasses(elem, classList) {
      classList.forEach(function (_className) {
        elem.classList.add(_className);
      });
    };

    exports.AddClasses = AddClasses;

    var RemoveClasses = function RemoveClasses(elem, classList) {
      classList.forEach(function (_className) {
        elem.classList.remove(_className);
      });
    };

    exports.RemoveClasses = RemoveClasses;

    var QueryMedia = function QueryMedia(mediaQuery) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var query = window.matchMedia(mediaQuery);

      if (callback == null) {
        return query.matches;
      } else {
        callback({
          matches: query.matches,
          remove: null
        });

        var ObserveResult = function ObserveResult(matches) {
          callback({
            matches: matches,
            // use removeListener to support legacy browsers like 11 
            //remove: () => query.removeEventListener('change', handler)
            remove: function remove() {
              return query.removeListener(handler);
            }
          });
        };

        var handler = function handler(e) {
          ObserveResult(e.matches);
        }; // use addListener to support legacy browsers like 11


        query.addListener(handler); //query.addEventListener('change', handler);
      }
    };

    exports.QueryMedia = QueryMedia;
  }, {}],
  6: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ResetMutationObserver = exports.StopMutationObserver = exports.RemoveMutationListener = exports.AddMutationListener = void 0;
    var mutationObserver = null;

    (function () {
      mutationObserver = new MutationObserver(function (mutations) {
        subscribers.forEach(function (subscriber) {
          subscriber.callback(mutations);
        });
      }); //https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit

      mutationObserver.observe(document, {
        attributes: false,
        childList: true,
        subtree: true,
        characterData: true
      });
    })();

    var subscribers = []; // {
    //     name: "",
    //     callback: method
    // };

    var AddMutationListener = function AddMutationListener(subscriber) {
      // check if already subscribed
      var alreadySubscribed = subscribers.some(function (s) {
        return s.name == subscriber.name;
      });

      if (!alreadySubscribed) {
        subscribers.push(subscriber); // Let's say AnimateIO is initialized at T0 and finds zero elements
        // Then we add a mutation listener after arbitrary delay of 1000ms
        // It's definitely possible that some mutations might have taken place in this time
        // And the elements added in this time didn't get registered
        // To overcome this issue we will manually execute subscriber callback once

        subscriber.callback();
      }
    };

    exports.AddMutationListener = AddMutationListener;

    var RemoveMutationListener = function RemoveMutationListener(name) {
      var index = subscribers.findIndex(function (s) {
        return s.name == name;
      });

      if (index > -1) {
        subscribers.splice(index, 1);
      }

      if (subscribers.length == 0) {
        StopMutationObserver();
      }
    };

    exports.RemoveMutationListener = RemoveMutationListener;

    var StopMutationObserver = function StopMutationObserver() {
      mutationObserver.disconnect();
    };

    exports.StopMutationObserver = StopMutationObserver;

    var ResetMutationObserver = function ResetMutationObserver() {
      StopMutationObserver();
      subscribers = [];
    };

    exports.ResetMutationObserver = ResetMutationObserver;
  }, {}],
  7: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.RestartAnimateIO = exports.DestroyAnimateIO = exports.ResetAnimateIO = exports.KillAllObservers = exports.ObserveElementsContinuous = exports.ObserveElementsOnce = exports.InitAIObservers = void 0;

    var _Settings = require("./Settings");

    var _Helpers = require("./Helpers");

    var _Mutations = require("./Mutations");

    var ObserverList = [];

    var InitAIObservers = function InitAIObservers() {
      // Scan for all AIO Elements & create observer for all of them
      // Multiple observers so we can individually disconnect any element that we want
      ObserveAIOElements(); // look for new observable objects 
      // delay observing newly added elements for whatever reasons after a delay of X milliseconds

      if (_Settings.ObserverSettings.trackMutations) {
        setTimeout(function () {
          return AddNewAIOElements();
        }, _Settings.ObserverSettings.mutationWatchDelay);
      }
    };

    exports.InitAIObservers = InitAIObservers;

    var AddNewAIOElements = function AddNewAIOElements() {
      (0, _Mutations.AddMutationListener)({
        name: 'observer_listener',
        callback: function callback(mutations) {
          // attach observers after a light delay
          setTimeout(function () {
            return ObserveAIOElements();
          }, 10);
        }
      });
    };

    var helperCounter = 0;

    var ObserveAIOElements = function ObserveAIOElements() {
      var AIOElements = document.querySelectorAll("[".concat(_Settings.ObserverSettings.observableAttrName, "]"));
      var elements = Array.from(AIOElements).filter(function (elem) {
        return !elem.hasAttribute('data-aio-id');
      });
      elements.forEach(function (elem, i) {
        elem.setAttribute('data-aio-id', "aio_auto_".concat(++helperCounter, "_").concat(i));

        var repeat = elem.hasAttribute('data-aio-repeat') || _Settings.ObserverSettings.repeat;

        var delay = (0, _Helpers.AttrToNum)(elem, 'data-aio-delay', _Settings.ObserverSettings.delay);
        var rootMargin = _Settings.ObserverSettings.rootMargin;

        if (elem.hasAttribute('data-aio-offset')) {
          var offsetVal = elem.getAttribute('data-aio-offset');

          if (offsetVal != null && offsetVal.length > 0) {
            rootMargin = offsetVal;
          }
        }

        var intersected = false;
        var custom_entry_attrVal = (0, _Helpers.GetAttrVal)(elem, 'data-aio-enter-class', '');
        var entry_classlist = [_Settings.ObserverSettings.enterIntersectionClassName, custom_entry_attrVal.split(' ')];
        var aioType = elem.getAttribute(_Settings.ObserverSettings.observableAttrName);

        if (aioType.length > 0) {
          entry_classlist.push("aio-".concat(aioType));
        }

        entry_classlist = entry_classlist.filter(function (_class) {
          return _class != '';
        });
        var custom_exit_attrVal = (0, _Helpers.GetAttrVal)(elem, 'data-aio-exit-class', '');
        var exit_classlist = [_Settings.ObserverSettings.exitIntersectionClassName, custom_exit_attrVal.split(' ')];
        exit_classlist = exit_classlist.filter(function (_class) {
          return _class != '';
        });
        var attributesApplied = false;
        var lazy_attr_list = [];
        var lazy_attrVal = (0, _Helpers.GetAttrVal)(elem, 'data-aio-lazy-attr', null);

        if (lazy_attrVal != null && lazy_attrVal.length > 10) {
          var parsed_array = JSON.parse(lazy_attrVal);

          if (Array.isArray(parsed_array)) {
            if (parsed_array.length > 0) lazy_attr_list.push.apply(lazy_attr_list, _toConsumableArray(parsed_array));
          }
        }

        var intersectionsettings = {
          root: _Settings.ObserverSettings.root,
          rootMargin: rootMargin,
          threshold: _Settings.ObserverSettings.threshold
        };
        var Observer = new IntersectionObserver(function (entries, _observer) {
          entries.forEach(function (entry) {
            var ratio = entry.intersectionRatio;
            var entryTimeOut = 0;

            if (ratio > 0) {
              intersected = true; // add custom attributes

              if (!attributesApplied) {
                attributesApplied = true;
                lazy_attr_list.forEach(function (attr) {
                  var key = Object.keys(attr)[0];
                  entry.target.setAttribute(key, attr[key]);
                });
              } // add entry class names & remove exit class names


              entryTimeOut = setTimeout(function () {
                (0, _Helpers.RemoveClasses)(entry.target, exit_classlist);
                (0, _Helpers.AddClasses)(entry.target, entry_classlist);
              }, delay);
            }

            if (ratio == 0 && repeat) {
              clearTimeout(entryTimeOut); // add exit class names & remove entry class names

              (0, _Helpers.RemoveClasses)(entry.target, entry_classlist);
              (0, _Helpers.AddClasses)(entry.target, exit_classlist);
            }

            if (ratio == 0 && !repeat && intersected) {
              _observer.unobserve(elem);

              _observer.disconnect();
            }
          });
        }, intersectionsettings);
        Observer.observe(elem);
        ObserverList.push(Observer);
      });
    };

    var ObserveElements = function ObserveElements(target, options, callback, repeat) {
      var defaultOptions = _objectSpread({
        root: null,
        rootMargin: '0px',
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

      if (typeof target == 'string' && target.trim().length > 0) {
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
        console.error("Target element: '".concat(target, "' not found"));
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
      KillAllObservers();

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
      ResetAnimateIO();

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
      ResetAnimateIO();
      ObserveAIOElements();
    };

    exports.RestartAnimateIO = RestartAnimateIO;
  }, {
    "./Helpers": 5,
    "./Mutations": 6,
    "./Settings": 9
  }],
  8: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ForceRenderLoop = exports.StopRenderLoop = exports.RenderLoop = exports.InitRenderer = void 0;

    var _AnimationStateMachine = require("./AnimationStateMachine");

    var _Settings = require("./Settings");

    var scrollTop = 0;
    var scrollTopPrev = -1;
    var doc = document.documentElement;
    var raf_id = 0; // Request Animate Frame ID

    var InitRenderer = function InitRenderer() {
      var useFps = true;
      var fps = _Settings.AnimationSettings.fps;

      if (fps != null) {
        var num = parseFloat(fps);
        useFps = !isNaN(num);
      }

      if (useFps) {
        (function animationTimeoutUpdate() {
          RenderLoop();
          setTimeout(function () {
            raf_id = requestAnimationFrame(animationTimeoutUpdate);
          }, 1000 / fps);
        })();
      } else {
        (function animationUpdate() {
          RenderLoop();
          raf_id = requestAnimationFrame(animationUpdate);
        })();
      }
    };

    exports.InitRenderer = InitRenderer;
    var forceRender = false;

    var RenderLoop = function RenderLoop() {
      if (_AnimationStateMachine.StateMachine.activeCount == 0) return;
      scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0); // Exit render loop if no scrolling happened in this frame
      // Exception: Continue with the render loop if forceRender flag is true

      if (scrollTop == scrollTopPrev && !forceRender) return;
      scrollTopPrev = scrollTop;
      document.body.setAttribute("data-scroll-top", scrollTop);
      forceRender = false;

      var entries = _AnimationStateMachine.StateMachine.elements.filter(function (entry) {
        return entry.ratio > 0;
      });

      entries.forEach(function (entry) {
        var frames = entry.keyframes;
        var elem = entry.domElement;
        var elemTop = elem.offsetTop; //convert offset to absolute

        if (_Settings.AnimationSettings.mode == "relative") {
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

    exports.RenderLoop = RenderLoop;

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

    var StopRenderLoop = function StopRenderLoop() {
      cancelAnimationFrame(raf_id);
    }; // Force rederloop when new elements are added to statemachine


    exports.StopRenderLoop = StopRenderLoop;

    var ForceRenderLoop = function ForceRenderLoop() {
      forceRender = true;
    };

    exports.ForceRenderLoop = ForceRenderLoop;
  }, {
    "./AnimationStateMachine": 2,
    "./Settings": 9
  }],
  9: [function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.OverrideDefaultAnimationSettings = exports.AnimationSettings = exports.OverrideDefaultObserverSettings = exports.ObserverSettings = void 0;
    var DefaultObserverSettings = {
      delay: 0,
      observableAttrName: "data-aiobserve",
      enterIntersectionClassName: "aio-enter",
      exitIntersectionClassName: "aio-exit",
      repeat: false,
      trackMutations: true,
      mutationWatchDelay: 0,
      root: null,
      rootMargin: '0px 0px 0px 0px',
      threshold: 0
    };
    var ObserverSettings = null;
    exports.ObserverSettings = ObserverSettings;

    var OverrideDefaultObserverSettings = function OverrideDefaultObserverSettings(_settings) {
      exports.ObserverSettings = ObserverSettings = _objectSpread(_objectSpread({}, DefaultObserverSettings), _settings);
      return ObserverSettings;
    };

    exports.OverrideDefaultObserverSettings = OverrideDefaultObserverSettings;
    var DefaultAnimationSettings = {
      mode: 'relative',
      fps: null,
      deactivateBelow: 1025,
      trackMutations: true,
      mutationWatchDelay: 0,
      gridHelper: false
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