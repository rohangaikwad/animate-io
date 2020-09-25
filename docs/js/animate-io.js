(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _Settings = require("./modules/Settings");

var _Observer = require("./modules/Observer");

var _Animations = require("./modules/Animations");

(window => {
  let InitObservers = _settings => {
    // override settings passed from initialization
    (0, _Settings.OverrideDefaultObserverSettings)(_settings); // scan for observable elements, attach intersection observer to each

    (0, _Observer.ObserveAIOElements)();
  };

  let Animate = _settings => {
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

},{"./modules/Animations":3,"./modules/Observer":5,"./modules/Settings":7}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ObserveStateMachineObjects = exports.InitAnimationStateMachine = exports.StateMachine = void 0;

var _Helpers = require("./Helpers");

var _Render = require("./Render");

const StateMachine = {
  activeCount: 0,
  elements: [],
  singleFrameElements: []
};
exports.StateMachine = StateMachine;

const InitAnimationStateMachine = () => {
  // filter out data-aio-<int> elements and push them to the StateMachine so that we can track them later
  populateStateMachine(); // attach an observer to all the elements added to the State Machine
  // observeStateMachineObjects(fps);
}; // State Machine Object Template


exports.InitAnimationStateMachine = InitAnimationStateMachine;
const SMOTemplate = {
  id: '',
  domElement: null,
  ratio: 0,
  repeat: true,
  keyframes: []
};

const populateStateMachine = () => {
  let _elements = document.getElementsByTagName("*");

  [..._elements].forEach((elem, i) => {
    let {
      attributes
    } = elem; // Match elements with the signature: data-aio-<int>
    // Example: data-aio-1000, data-aio-0

    let matched = Array.from(attributes).some(attr => /^data-aio--?[0-9]+/g.test(attr.name));

    if (matched) {
      let keyframes = Array.from(attributes).filter(attr => /^data-aio--?[0-9]+/g.test(attr.name));
      let id = `aio-pl-${i}`;
      elem.setAttribute('data-aio-pl-id', id);
      let entry = { ...SMOTemplate
      };
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

  if (settings.mode == "relative") {
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

const ObserveStateMachineObjects = () => {
  console.log(StateMachine);

  if (StateMachine.elements.length > 0) {
    let observerSettings = {
      root: document,
      rootMargin: 0,
      threshold: 0
    }; // init observer

    let observer = new IntersectionObserver((entries, observerSettings) => {
      //console.log(entries)
      entries.forEach(entry => {
        let elem = entry.target;
        let aioPlId = elem.getAttribute('data-aio-pl-id');
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
    });
    StateMachine.elements.forEach(elem => {
      observer.observe(elem.domElement);
    }); // init render

    let useFps = true;

    if (fps != null) {
      let num = parseFloat(fps);
      useFps = !isNaN(num);
    }

    if (useFps) {
      (function animationTimeoutUpdate() {
        (0, _Render.Render)();
        setTimeout(() => {
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

},{"./Helpers":4,"./Render":6}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InitAnimations = void 0;

var _AnimationStateMachine = require("./AnimationStateMachine");

var _Helpers = require("./Helpers");

var _Settings = require("./Settings");

const InitAnimations = () => {
  //scan for animateable elements, build the state machine
  (0, _AnimationStateMachine.InitAnimationStateMachine)(); // init rendering for all the elements

  (0, _AnimationStateMachine.ObserveStateMachineObjects)();

  if (_Settings.ObserverSettings.gridHelper) {
    setTimeout(() => (0, _Helpers.DrawGrid)(), 1000);
  }
};

exports.InitAnimations = InitAnimations;

},{"./AnimationStateMachine":2,"./Helpers":4,"./Settings":7}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawGrid = exports.AttrToNum = exports.GetAttrVal = void 0;

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

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RestartAnimateIO = exports.DestroyAnimateIO = exports.ResetAnimateIO = exports.KillAllObservers = exports.ObserveElementsContinuous = exports.ObserveElementsOnce = exports.ObserveAIOElements = void 0;

var _Settings = require("./Settings");

var _Helpers = require("./Helpers");

let elements = null;
let ObserverList = [];

const ObserveAIOElements = () => {
  elements = document.querySelectorAll(`[${_Settings.ObserverSettings.observableAttrName}]`);
  elements.forEach((elem, i) => {
    elem.setAttribute('data-aio-id', `aio_auto_${i}`);

    let repeat = elem.hasAttribute('data-aio-repeat') || _Settings.ObserverSettings.repeat;

    let delay = (0, _Helpers.AttrToNum)(elem, 'data-aio-delay', _Settings.ObserverSettings.delay);
    let offsetTop = (0, _Helpers.GetAttrVal)(elem, 'data-aio-offset-top', _Settings.ObserverSettings.rootMargin.split(" ")[0]);
    let offsetRgt = (0, _Helpers.GetAttrVal)(elem, 'data-aio-offset-right', _Settings.ObserverSettings.rootMargin.split(" ")[1]);
    let offsetBtm = (0, _Helpers.GetAttrVal)(elem, 'data-aio-offset-bottom', _Settings.ObserverSettings.rootMargin.split(" ")[2]);
    let offsetLft = (0, _Helpers.GetAttrVal)(elem, 'data-aio-offset-left', _Settings.ObserverSettings.rootMargin.split(" ")[3]);
    let rootMargin = `${offsetTop} ${offsetRgt} ${offsetBtm} ${offsetLft}`;

    if (elem.hasAttribute("data-aio-offset")) {
      let offsetVal = elem.getAttribute("data-aio-offset");

      if (offsetVal != null && offsetVal.length > 0) {
        rootMargin = offsetVal;
      }
    }

    let intersected = false;
    let classes = [];
    let aioType = elem.getAttribute(_Settings.ObserverSettings.observableAttrName);

    if (aioType.length > 0) {
      classes.push(`aio-${aioType}`);
    }

    let intersectionsettings = {
      root: _Settings.ObserverSettings.root,
      rootMargin: rootMargin,
      threshold: _Settings.ObserverSettings.threshold
    };
    let observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        let ratio = entry.intersectionRatio;
        let entryTimeOut = 0;

        if (ratio > 0) {
          intersected = true;
          entryTimeOut = setTimeout(() => {
            entry.target.classList.remove(_Settings.ObserverSettings.exitIntersectionClassName);
            entry.target.classList.add(_Settings.ObserverSettings.enterIntersectionClassName);
            classes.forEach(c => {
              entry.target.classList.add(c);
            });
          }, delay);
        }

        if (ratio == 0 && repeat) {
          clearTimeout(entryTimeOut);
          entry.target.classList.remove(_Settings.ObserverSettings.enterIntersectionClassName);
          classes.forEach(c => {
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

const ObserveElements = (target, options, callback, repeat) => {
  let defaultOptions = {
    root: document,
    rootMargin: 0,
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

  if (typeof target == "string" && target.trim().length > 0) {
    document.querySelectorAll(target).forEach(elem => observer.observe(elem));
  } else if (target instanceof Element) {
    observer.observe(target);
  } else if (NodeList.prototype.isPrototypeOf(target)) {
    target.forEach(elem => observer.observe(elem));
  } else if (HTMLCollection.prototype.isPrototypeOf(target)) {
    [...target].forEach(elem => observer.observe(elem));
  } else {
    console.error(`Target element: "${target}" not found`);
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
  killAllObservers();

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
  resetAnimateIO();

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
  resetAnimateIO();
  main();
};

exports.RestartAnimateIO = RestartAnimateIO;

},{"./Helpers":4,"./Settings":7}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Render = void 0;

var _AnimationStateMachine = require("./AnimationStateMachine");

let scrollTop = 0;
let scrollTopPrev = -1;
let doc = document.documentElement;

const Render = () => {
  if (_AnimationStateMachine.StateMachine.activeCount == 0) return;
  scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
  if (scrollTop == scrollTopPrev) return;
  scrollTopPrev = scrollTop;
  document.body.setAttribute("data-scroll-top", scrollTop);

  let entries = _AnimationStateMachine.StateMachine.elements.filter(entry => entry.ratio > 0);

  entries.forEach(entry => {
    let frames = entry.keyframes;
    let elem = entry.domElement;
    let elemTop = elem.offsetTop; //convert offset to absolute

    if (settings.mode == "relative") {
      frames.forEach((f, i) => {
        let offset = elemTop + f.offset - window.innerHeight;
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

exports.Render = Render;

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

},{"./AnimationStateMachine":2}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OverrideDefaultAnimationSettings = exports.AnimationSettings = exports.OverrideDefaultObserverSettings = exports.ObserverSettings = void 0;
const DefaultObserverSettings = {
  delay: 0,
  offset: 0,
  observableAttrName: "data-aiobserve",
  enterIntersectionClassName: "aio-enter",
  exitIntersectionClassName: "aio-exit",
  repeat: false,
  threshold: 0,
  root: document,
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
  trackMutations: true,
  requiredWidth: 1025
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
  gridHelper: false,
  mode: 'relative',
  fps: null
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

},{}]},{},[1]);
