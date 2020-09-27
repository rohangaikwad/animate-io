(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _Settings = require("./modules/Settings");

var _ObserverManager = require("./modules/ObserverManager");

var _AnimationManager = require("./modules/AnimationManager");

(window => {
  let InitObservers = _settings => {
    // override settings passed from initialization
    (0, _Settings.OverrideDefaultObserverSettings)(_settings); // scan for observable elements, attach intersection observer to each

    (0, _ObserverManager.InitAIObservers)();
  };

  let Animate = _settings => {
    // override settings passed from initialization
    (0, _Settings.OverrideDefaultAnimationSettings)(_settings); // scan for animateable elements, build the state machine, init rendering

    (0, _AnimationManager.InitAnimations)();
  };

  window.AnimateIO = {
    InitObservers: InitObservers,
    Observe: _ObserverManager.ObserveElementsContinuous,
    ObserveOnce: _ObserverManager.ObserveElementsOnce,
    StopObservers: _ObserverManager.KillAllObservers,
    DestroyObservers: _ObserverManager.DestroyAnimateIO,
    RestartObservers: _ObserverManager.RestartAnimateIO,
    Animate: Animate,
    AnimateEnd: _AnimationManager.KillAnimateInstance,
    AnimateRestart: _AnimationManager.RestartAnimateInstance
  };
})(window);

},{"./modules/AnimationManager":2,"./modules/ObserverManager":7,"./modules/Settings":9}],2:[function(require,module,exports){
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

let AnimationsInitialized = false;

const InitAnimations = () => {
  if (AnimationsInitialized) {
    console.error('AnimateIO.Animate() already initialized. To start a new instance, please stop the current animations instance using:\nAnimateIO.StopAnimations();');
  } // Check if browser dimensions are correct


  let canInitialize = (0, _Helpers.QueryMedia)(_Settings.AnimationSettings.activeRange);

  if (!canInitialize) {
    console.log(`AnimateIO.Animate() can't initialize since the screen width is outside the range: ${_Settings.AnimationSettings.activeRange}`);
    return;
  } // Initiate animation observer


  (0, _AnimationStateMachine.InitiateAnimationObserver)(); //scan for animateable elements, build the state machine

  (0, _AnimationStateMachine.InitAnimationStateMachine)(); // attach an observer to all the elements added to the State Machine

  (0, _AnimationStateMachine.ObserveStateMachineObjects)(); // init rendering for all the elements

  (0, _Render.InitRenderer)(); // look for new animateable objects with the signature data-aio-<int>
  // start looking for new elements after an arbitrary delay of 2 seconds

  if (_Settings.AnimationSettings.trackMutations) {
    setTimeout(() => AddNewElementsToStateMachine(), _Settings.AnimationSettings.mutationWatchDelay);
  } // show a helper grid and markers for where an animation will start and end


  if (_Settings.AnimationSettings.gridHelper) {
    setTimeout(() => (0, _Helpers.DrawGrid)(), 1000);
  }

  AnimationsInitialized = true; // Check for browser resolution changes    

  WatchBrowserResize();
};

exports.InitAnimations = InitAnimations;

const AddNewElementsToStateMachine = () => {
  (0, _Mutations.AddMutationListener)({
    name: 'animations_listener',
    callback: mutations => {
      (0, _AnimationStateMachine.UpdateStateMachine)();
    }
  });
};

const WatchBrowserResize = () => {
  (0, _Helpers.QueryMedia)(_Settings.AnimationSettings.activeRange, response => {
    if (response.matches) {
      // Start animations if not already initialized
      if (!AnimationsInitialized) {
        if (response.remove != null) {
          response.remove();
          console.log(`Restarting AnimateIO.Animate as browser width is inside the acceptable range: ${_Settings.AnimationSettings.activeRange}px`);
          InitAnimations();
        }
      }
    } else {
      // stop the animations if browser window shrinks below defined width
      if (AnimationsInitialized) {
        console.log(`Stopping AnimateIO.Animate as browser width is outside the range: ${_Settings.AnimationSettings.activeRange}`);
        KillAnimateInstance();
      }
    }
  });
};

const KillAnimateInstance = () => {
  // stop rendering
  (0, _Render.StopRenderLoop)(); // Stop animation intersection observer

  (0, _AnimationStateMachine.StopAnimationObserver)(); // disconnect mutation observer

  (0, _Mutations.ResetMutationObserver)(); // reset state machine & remove state machine id attribute

  (0, _AnimationStateMachine.ResetStateMachine)();
  AnimationsInitialized = false;
};

exports.KillAnimateInstance = KillAnimateInstance;

const RestartAnimateInstance = () => {
  KillAnimateInstance();
  InitAnimations();
};

exports.RestartAnimateInstance = RestartAnimateInstance;

},{"./AnimationStateMachine":3,"./Helpers":5,"./Mutations":6,"./Render":8,"./Settings":9}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResetStateMachine = exports.StopAnimationObserver = exports.ObserveStateMachineObjects = exports.InitiateAnimationObserver = exports.UpdateStateMachine = exports.InitAnimationStateMachine = exports.StateMachine = void 0;

var _Constants = require("./Constants");

var _Render = require("./Render");

var _Settings = require("./Settings");

const StateMachine = {
  activeCount: 0,
  elements: [],
  singleFrameElements: []
};
exports.StateMachine = StateMachine;

const InitAnimationStateMachine = () => {
  // filter out data-aio-<int> elements and push them to the StateMachine so that we can track them later
  populateStateMachine(count => {
    console.log(`${count} animateable elements found`);
  });
};

exports.InitAnimationStateMachine = InitAnimationStateMachine;

const UpdateStateMachine = (callback = null) => {
  populateStateMachine(count => {
    console.log(`${count} new animateable elements found`);
    ObserveStateMachineObjects(); // Wait for observers to get attached to new elements

    setTimeout(() => (0, _Render.ForceRenderLoop)(), 100);
  });
}; // State Machine Object Template


exports.UpdateStateMachine = UpdateStateMachine;
const SMOTemplate = {
  id: '',
  domElement: null,
  ratio: 0,
  repeat: true,
  keyframes: [],
  observerAttached: false
};
let populateCounter = 0; // use this counter to generate unique ids for elements

const populateStateMachine = done => {
  let AllElements = document.getElementsByTagName("*"); // Filter elements with the signature: data-aio-<int>
  // Example: data-aio-1000, data-aio-0

  let AIOElements = [...AllElements].filter(elem => {
    let attributes = Object.entries(elem.attributes).map(a => a[1]);
    return attributes.some(f => /^data-aio--?[0-9]+/g.test(f.name));
  }); // remove elements which have already been added & tracked inside animation state machien list

  let _elements = AIOElements.filter(elem => !elem.hasAttribute(_Constants.SMO_ID_ATTR_NAME));

  _elements.forEach((elem, i) => {
    let {
      attributes
    } = elem;
    let keyframes = Array.from(attributes).filter(attr => /^data-aio--?[0-9]+/g.test(attr.name));
    let id = `aio-pl-${++populateCounter}-${i}`;
    elem.setAttribute(_Constants.SMO_ID_ATTR_NAME, id);
    let entry = { ...SMOTemplate
    };
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

const processKeyFrames = (kf, elem) => {
  let frames = [];
  kf.forEach((f, i) => {
    let _props = {};
    f.value.trim().split(";").forEach(p => {
      if (p.length > 0) {
        let key = p.split(":")[0].trim();
        let val = p.split(":")[1].trim();
        let numbers = []; //Now parse ANY number inside this string and create a format string.

        val = val.replace(/[\-+]?[\d]*\.?[\d]+/g, n => {
          numbers.push(+n);
          return '{?}';
        }); //Add the formatstring as first value.

        numbers.unshift(val);
        _props[key] = {
          value: numbers
        };
      }
    });

    let _offset = parseInt(f.name.replace('data-aio-', ''));

    frames.push({
      offset: _offset,
      absOffset: _offset,
      props: _props
    });
    elem.setAttribute(`data-kf-${i}`, _offset);
  }); //convert offset to absolute

  if (_Settings.AnimationSettings.mode == "relative") {
    frames.forEach((f, i) => {
      let offset = elem.offsetTop + f.offset - window.innerHeight;
      f.absOffset = offset;
      elem.setAttribute(`data-kf-${i}`, offset);
    });
  }

  frames.sort((a, b) => a.absOffset > b.absOffset ? 1 : b.absOffset > a.absOffset ? -1 : 0); // handle missing props between frames

  let frameIndex = 0;
  let propList = {}; //iterate from left to right

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

let _fillPropForFrame = function (frame, propList) {
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

let AnimationObserver = null;

const InitiateAnimationObserver = () => {
  let observerSettings = {
    root: null,
    rootMargin: '0px',
    threshold: 0
  }; // init observer

  AnimationObserver = new IntersectionObserver((entries, observer) => {
    //console.log(entries)
    entries.forEach(entry => {
      let elem = entry.target;
      let aioPlId = elem.getAttribute(_Constants.SMO_ID_ATTR_NAME);
      let stateMachineObject = StateMachine.elements.filter(o => o.id == aioPlId)[0];
      let intersected = false;
      let ratio = entry.intersectionRatio;
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
          let smoIndex = StateMachine.elements.findIndex(o => o.id == aioPlId);
          StateMachine.elements.splice(smoIndex, 1);
        }
      }
    });
  }, observerSettings);
};

exports.InitiateAnimationObserver = InitiateAnimationObserver;

const ObserveStateMachineObjects = () => {
  if (StateMachine.elements.length > 0) {
    let newStateMachineElements = StateMachine.elements.filter(elem => !elem.observerAttached);
    newStateMachineElements.forEach(elem => {
      AnimationObserver.observe(elem.domElement);
      elem.observerAttached = true;
    });
  }
};

exports.ObserveStateMachineObjects = ObserveStateMachineObjects;

const StopAnimationObserver = () => {
  AnimationObserver.disconnect();
};

exports.StopAnimationObserver = StopAnimationObserver;

const RemoveSMOAttributes = () => {
  let StateMachineObjects = [...StateMachine.elements, ...StateMachine.singleFrameElements];
  StateMachineObjects.forEach(smo => {
    smo.domElement.removeAttribute(_Constants.SMO_ID_ATTR_NAME);
  });
};

const ResetStateMachine = () => {
  RemoveSMOAttributes();
  StateMachine.activeCount = 0;
  StateMachine.elements = [];
  StateMachine.singleFrameElements = [];
};

exports.ResetStateMachine = ResetStateMachine;

},{"./Constants":4,"./Render":8,"./Settings":9}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SMO_ID_ATTR_NAME = void 0;
const SMO_ID_ATTR_NAME = 'data-aio-smo-id';
exports.SMO_ID_ATTR_NAME = SMO_ID_ATTR_NAME;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QueryMedia = exports.RemoveClasses = exports.AddClasses = exports.DrawGrid = exports.AttrToNum = exports.GetAttrVal = void 0;

const GetAttrVal = (elem, attr, defaultValue) => {
  let val = defaultValue;

  if (elem.hasAttribute(attr)) {
    let attrval = elem.getAttribute(attr);

    if (attrval != null) {
      val = attrval;
    }
  }

  return val;
};

exports.GetAttrVal = GetAttrVal;

const AttrToNum = (elem, attr, defaultValue) => {
  let val = GetAttrVal(elem, attr, defaultValue);
  let num = parseInt(val);
  return Number.isNaN(num) ? defaultValue : num;
};

exports.AttrToNum = AttrToNum;

const DrawGrid = () => {
  let gridContainer = document.createElement('div');
  gridContainer.id = "aio-grid-container";
  let h = document.documentElement.scrollHeight;

  for (let i = 0; i < h; i += 100) {
    let div = document.createElement('div');
    div.className = "aio-row";
    div.innerHTML = `<div class="num">${i}</div><div class="num">${i}</div>`;
    gridContainer.appendChild(div);
  }

  document.body.appendChild(gridContainer);
};

exports.DrawGrid = DrawGrid;

const AddClasses = (elem, classList) => {
  classList.forEach(_className => {
    elem.classList.add(_className);
  });
};

exports.AddClasses = AddClasses;

const RemoveClasses = (elem, classList) => {
  classList.forEach(_className => {
    elem.classList.remove(_className);
  });
};

exports.RemoveClasses = RemoveClasses;

const QueryMedia = (mediaQuery, callback = null) => {
  let query = window.matchMedia(mediaQuery);

  if (callback == null) {
    return query.matches;
  } else {
    callback({
      matches: query.matches,
      remove: null
    });

    let ObserveResult = matches => {
      callback({
        matches: matches,
        // use removeListener to support legacy browsers like 11 
        //remove: () => query.removeEventListener('change', handler)
        remove: () => query.removeListener(handler)
      });
    };

    let handler = e => {
      ObserveResult(e.matches);
    }; // use addListener to support legacy browsers like 11


    query.addListener(handler); //query.addEventListener('change', handler);
  }
};

exports.QueryMedia = QueryMedia;

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResetMutationObserver = exports.StopMutationObserver = exports.RemoveMutationListener = exports.AddMutationListener = void 0;
let mutationObserver = null;

(() => {
  mutationObserver = new MutationObserver(mutations => {
    subscribers.forEach(subscriber => {
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

let subscribers = []; // {
//     name: "",
//     callback: method
// };

const AddMutationListener = subscriber => {
  // check if already subscribed
  let alreadySubscribed = subscribers.some(s => s.name == subscriber.name);

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

const RemoveMutationListener = name => {
  let index = subscribers.findIndex(s => s.name == name);

  if (index > -1) {
    subscribers.splice(index, 1);
  }

  if (subscribers.length == 0) {
    StopMutationObserver();
  }
};

exports.RemoveMutationListener = RemoveMutationListener;

const StopMutationObserver = () => {
  mutationObserver.disconnect();
};

exports.StopMutationObserver = StopMutationObserver;

const ResetMutationObserver = () => {
  StopMutationObserver();
  subscribers = [];
};

exports.ResetMutationObserver = ResetMutationObserver;

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RestartAnimateIO = exports.DestroyAnimateIO = exports.ResetAnimateIO = exports.KillAllObservers = exports.ObserveElementsContinuous = exports.ObserveElementsOnce = exports.InitAIObservers = void 0;

var _Settings = require("./Settings");

var _Helpers = require("./Helpers");

var _Mutations = require("./Mutations");

let ObserverList = [];

const InitAIObservers = () => {
  // Scan for all AIO Elements & create observer for all of them
  // Multiple observers so we can individually disconnect any element that we want
  ObserveAIOElements(); // look for new observable objects 
  // delay observing newly added elements for whatever reasons after a delay of X milliseconds

  if (_Settings.ObserverSettings.trackMutations) {
    setTimeout(() => AddNewAIOElements(), _Settings.ObserverSettings.mutationWatchDelay);
  }
};

exports.InitAIObservers = InitAIObservers;

const AddNewAIOElements = () => {
  (0, _Mutations.AddMutationListener)({
    name: 'observer_listener',
    callback: mutations => {
      // attach observers after a light delay
      setTimeout(() => ObserveAIOElements(), 10);
    }
  });
};

let helperCounter = 0;

const ObserveAIOElements = () => {
  let AIOElements = document.querySelectorAll(`[${_Settings.ObserverSettings.observableAttrName}]`);
  let elements = Array.from(AIOElements).filter(elem => !elem.hasAttribute('data-aio-id'));
  elements.forEach((elem, i) => {
    elem.setAttribute('data-aio-id', `aio_auto_${++helperCounter}_${i}`);

    let repeat = elem.hasAttribute('data-aio-repeat') || _Settings.ObserverSettings.repeat;

    let delay = (0, _Helpers.AttrToNum)(elem, 'data-aio-delay', _Settings.ObserverSettings.delay);
    let {
      rootMargin
    } = _Settings.ObserverSettings;

    if (elem.hasAttribute('data-aio-offset')) {
      let offsetVal = elem.getAttribute('data-aio-offset');

      if (offsetVal != null && offsetVal.length > 0) {
        rootMargin = offsetVal;
      }
    }

    let intersected = false;
    let custom_entry_attrVal = (0, _Helpers.GetAttrVal)(elem, 'data-aio-enter-class', '');
    let entry_classlist = [_Settings.ObserverSettings.enterIntersectionClassName, custom_entry_attrVal.split(' ')];
    let aioType = elem.getAttribute(_Settings.ObserverSettings.observableAttrName);

    if (aioType.length > 0) {
      entry_classlist.push(`aio-${aioType}`);
    }

    entry_classlist = entry_classlist.filter(_class => _class != '');
    let custom_exit_attrVal = (0, _Helpers.GetAttrVal)(elem, 'data-aio-exit-class', '');
    let exit_classlist = [_Settings.ObserverSettings.exitIntersectionClassName, custom_exit_attrVal.split(' ')];
    exit_classlist = exit_classlist.filter(_class => _class != '');
    let attributesApplied = false;
    let lazy_attr_list = [];
    let lazy_attrVal = (0, _Helpers.GetAttrVal)(elem, 'data-aio-lazy-attr', null);

    if (lazy_attrVal != null && lazy_attrVal.length > 10) {
      let parsed_array = JSON.parse(lazy_attrVal);

      if (Array.isArray(parsed_array)) {
        if (parsed_array.length > 0) lazy_attr_list.push(...parsed_array);
      }
    }

    debugger;
    let elementToObserve = elem; // watch self or another element(s)

    if (elem.hasAttribute('data-aio-ref')) {
      let refElems = document.querySelectorAll(elem.getAttribute('data-aio-ref'));

      if (refElems.length > 0) {
        elementToObserve = refElems;
      }
    }

    let intersectionsettings = {
      root: _Settings.ObserverSettings.root,
      rootMargin: rootMargin,
      threshold: _Settings.ObserverSettings.threshold
    };
    let Observer = new IntersectionObserver((entries, _observer) => {
      entries.forEach(entry => {
        let ratio = entry.intersectionRatio;
        let entryTimeOut = 0;

        if (ratio > 0) {
          intersected = true; // add custom attributes

          if (!attributesApplied) {
            attributesApplied = true;
            lazy_attr_list.forEach(attr => {
              let key = Object.keys(attr)[0];
              elem.setAttribute(key, attr[key]);
            });
          } // add entry class names & remove exit class names


          entryTimeOut = setTimeout(() => {
            (0, _Helpers.RemoveClasses)(elem, exit_classlist);
            (0, _Helpers.AddClasses)(elem, entry_classlist);
          }, delay);
        }

        if (ratio == 0 && repeat) {
          clearTimeout(entryTimeOut); // add exit class names & remove entry class names

          (0, _Helpers.RemoveClasses)(elem, entry_classlist);
          (0, _Helpers.AddClasses)(elem, exit_classlist);
        }

        if (ratio == 0 && !repeat && intersected) {
          _observer.unobserve(elem);

          _observer.disconnect();
        }
      });
    }, intersectionsettings);

    if (NodeList.prototype.isPrototypeOf(elementToObserve)) {
      // watch multiple objects
      debugger;
      elementToObserve.forEach(_elem => {
        Observer.observe(_elem);
      });
    } else {
      // watch self
      Observer.observe(elem);
    }

    ObserverList.push(Observer);
  });
};

const ObserveElements = (target, options, callback, repeat) => {
  let defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0,
    ...options
  };
  let observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      callback(entry);
      let ratio = entry.intersectionRatio;

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
    document.querySelectorAll(target).forEach(elem => observer.observe(elem));
  } else if (target instanceof Element) {
    observer.observe(target);
  } else if (NodeList.prototype.isPrototypeOf(target)) {
    target.forEach(elem => observer.observe(elem));
  } else if (HTMLCollection.prototype.isPrototypeOf(target)) {
    [...target].forEach(elem => observer.observe(elem));
  } else {
    console.error(`Target element: '${target}' not found`);
  }
};

const ObserveElementsOnce = (target, options, callback) => {
  ObserveElements(target, options, callback, false);
};

exports.ObserveElementsOnce = ObserveElementsOnce;

const ObserveElementsContinuous = (target, options, callback) => {
  ObserveElements(target, options, callback, true);
};

exports.ObserveElementsContinuous = ObserveElementsContinuous;

const KillAllObservers = () => {
  ObserverList.forEach(o => {
    o.disconnect();
  });
  ObserverList = [];
};

exports.KillAllObservers = KillAllObservers;

const ResetAnimateIO = () => {
  KillAllObservers();

  let _elems = document.querySelectorAll(`[${_Settings.ObserverSettings.observableAttrName}]`);

  _elems.forEach((elem, i) => {
    elem.classList.remove(Settings.enterIntersectionClassName);
    let aioType = elem.getAttribute(_Settings.ObserverSettings.observableAttrName);

    if (aioType.length > 0) {
      elem.classList.remove(`aio-${aioType}`);
    }
  });
};

exports.ResetAnimateIO = ResetAnimateIO;

const DestroyAnimateIO = () => {
  ResetAnimateIO();

  let _elems = document.querySelectorAll(`[${_Settings.ObserverSettings.observableAttrName}]`);

  _elems.forEach((elem, i) => {
    let {
      attributes
    } = elem;
    Array.from(attributes).forEach(attr => {
      if (attr.name.indexOf(_Settings.ObserverSettings.observableAttrName) > -1) {
        elem.removeAttribute(attr.name);
      }
    });
  });
};

exports.DestroyAnimateIO = DestroyAnimateIO;

const RestartAnimateIO = () => {
  ResetAnimateIO();
  ObserveAIOElements();
};

exports.RestartAnimateIO = RestartAnimateIO;

},{"./Helpers":5,"./Mutations":6,"./Settings":9}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ForceRenderLoop = exports.StopRenderLoop = exports.RenderLoop = exports.InitRenderer = void 0;

var _AnimationStateMachine = require("./AnimationStateMachine");

var _Settings = require("./Settings");

let scrollTop = 0;
let scrollTopPrev = -1;
let doc = document.documentElement;
let raf_id = 0; // Request Animate Frame ID

const InitRenderer = () => {
  let useFps = true;
  let {
    fps
  } = _Settings.AnimationSettings;

  if (fps != null) {
    let num = parseFloat(fps);
    useFps = !isNaN(num);
  }

  if (useFps) {
    (function animationTimeoutUpdate() {
      RenderLoop();
      setTimeout(() => {
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
let forceRender = false;

const RenderLoop = () => {
  if (_AnimationStateMachine.StateMachine.activeCount == 0) return;
  scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0); // Exit render loop if no scrolling happened in this frame
  // Exception: Continue with the render loop if forceRender flag is true

  if (scrollTop == scrollTopPrev && !forceRender) return;
  scrollTopPrev = scrollTop;
  document.body.setAttribute("data-scroll-top", scrollTop);
  forceRender = false;

  let entries = _AnimationStateMachine.StateMachine.elements.filter(entry => entry.ratio > 0);

  entries.forEach(entry => {
    let frames = entry.keyframes;
    let elem = entry.domElement;
    let elemTop = elem.offsetTop; //convert offset to absolute

    if (_Settings.AnimationSettings.mode == "relative") {
      frames.forEach((f, i) => {
        let offset = elemTop + f.offset; //offset -= window.innerHeight;

        f.absOffset = offset;
        elem.setAttribute(`data-kf-${i}`, offset);
      });
    }

    for (let i = 0; i < frames.length - 1; i++) {
      let curFrame = frames[i];
      let nxtFrame = frames[i + 1];
      let frame1_top = curFrame.absOffset;
      let frame2_top = nxtFrame.absOffset;
      let isBefore = scrollTop < frame1_top;
      let isAfter = scrollTop > frame2_top;

      if (isBefore || isAfter) {
        //console.log(isBefore, isAfter);
        let requiredFrame = isBefore ? curFrame : nxtFrame;
        Object.keys(requiredFrame.props).forEach((key, index) => {
          let prop = requiredFrame.props[key];

          let value = _interpolateString(prop.value);

          setStyle(elem, key, value);
        });
        return;
      }

      let progress = (scrollTop - frame1_top) / (frame2_top - frame1_top);
      Object.keys(curFrame.props).forEach(key => {
        let interpolatedValue = _calcInterpolation(curFrame.props[key].value, nxtFrame.props[key].value, progress);

        let value = _interpolateString(interpolatedValue);

        setStyle(elem, key, value);
      });
    }
  });
};

exports.RenderLoop = RenderLoop;

let _calcInterpolation = (val1, val2, progress) => {
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

let _interpolateString = val => {
  let i = 1;
  return val[0].replace(/\{\?\}/g, () => {
    return val[i++];
  });
};

let setStyle = (elem, key, value) => {
  let style = elem.style; // Extract "-x", "-m" from string "abc-xyz-mno" 

  let match = key.match(/-./g);

  if (match != null) {
    // convert font-size to fontSize
    let uprCs = match[0].toUpperCase();
    let prop = key.replace(match[0], uprCs).replace('-', '');
    style[prop] = value;
  } else {
    style[key] = value;
  }
};

const StopRenderLoop = () => {
  cancelAnimationFrame(raf_id);
}; // Force rederloop when new elements are added to statemachine


exports.StopRenderLoop = StopRenderLoop;

const ForceRenderLoop = () => {
  forceRender = true;
};

exports.ForceRenderLoop = ForceRenderLoop;

},{"./AnimationStateMachine":3,"./Settings":9}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OverrideDefaultAnimationSettings = exports.AnimationSettings = exports.OverrideDefaultObserverSettings = exports.ObserverSettings = void 0;
const DefaultObserverSettings = {
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
let ObserverSettings = null;
exports.ObserverSettings = ObserverSettings;

const OverrideDefaultObserverSettings = _settings => {
  exports.ObserverSettings = ObserverSettings = { ...DefaultObserverSettings,
    ..._settings
  };
  return ObserverSettings;
};

exports.OverrideDefaultObserverSettings = OverrideDefaultObserverSettings;
const DefaultAnimationSettings = {
  mode: 'relative',
  fps: null,
  activeRange: '(min-width: 1025px)',
  trackMutations: true,
  mutationWatchDelay: 0,
  gridHelper: false
};
let AnimationSettings = null;
exports.AnimationSettings = AnimationSettings;

const OverrideDefaultAnimationSettings = _settings => {
  exports.AnimationSettings = AnimationSettings = { ...DefaultAnimationSettings,
    ..._settings
  };
  return AnimationSettings;
};

exports.OverrideDefaultAnimationSettings = OverrideDefaultAnimationSettings;

},{}]},{},[1])

