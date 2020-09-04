((window) => {

    let observers = [];

    let defaultSettings = {
        gridHelper: false,
        mode: 'relative',
        delay: 0,
        offset: 0,
        enterIntersectionClassName: "aio-enter",
        exitIntersectionClassName: "aio-exit",
        repeat: false,
        threshold: 0,
        root: document,
        rootMargin: '0px 0px 0px 0px',
        threshold: 0
    }
    let settings = {};

    let elements = null;

    let getAttrVal = (elem, attr, defaultValue) => {
        let val = defaultValue;
        if (elem.hasAttribute(attr)) {
            let attrval = elem.getAttribute(attr);
            if (attrval != null) {
                val = attrval;
            }
        }
        return val;
    }

    let attrToNum = (elem, attr, defaultValue) => {
        let val = getAttrVal(elem, attr, defaultValue);
        let num = parseInt(val);
        return Number.isNaN(num) ? defaultValue : num;
    }

    let processKeyFrames = (kf, elem) => {
        let frames = [];
        kf.forEach((f,i) => {
            let _props = {}

            f.value.trim().split(";").forEach(p => {
                if (p.length > 0) {
                    let key = p.split(":")[0].trim();
                    let val = p.split(":")[1].trim();

                    let numbers = [];
                    //Now parse ANY number inside this string and create a format string.
                    val = val.replace(/[\-+]?[\d]*\.?[\d]+/g, (n) => {
                        numbers.push(+n);
                        return '{?}';
                    });

                    //Add the formatstring as first value.
                    numbers.unshift(val);

                    _props[key] = {
                        value: numbers
                    }
                }
            });

            let _offset = parseInt(f.name.replace('data-aio-', ''));
            frames.push({
                offset: _offset,
                absOffset: _offset,
                props: _props
            })
            
            elem.setAttribute(`data-kf-${i}`, _offset);
        });
        //convert offset to absolute
        if (settings.mode == "relative") {
            frames.forEach((f,i) => {
                let offset = elem.offsetTop + f.offset - window.innerHeight;
                f.absOffset = offset;
                elem.setAttribute(`data-kf-${i}`, offset);
            })
        }

        frames.sort((a, b) => a.absOffset > b.absOffset ? 1 : b.absOffset > a.absOffset ? -1 : 0);

        // handle missing props between frames
        let frameIndex = 0;
        let propList = {};

        //iterate from left to right
        for (; frameIndex < frames.length; frameIndex++) {
            _fillPropForFrame(frames[frameIndex], propList);
        }

        //iterate from right to left
        propList = {};
        frameIndex--;
        for (; frameIndex >= 0; frameIndex--) {
            _fillPropForFrame(frames[frameIndex], propList);
        }

        return frames;
    }

    let _fillPropForFrame = function (frame, propList) {
        var key;

        //For each key frame iterate over all right hand properties and assign them,
        //but only if the current key frame doesn't have the property by itself
        for (key in propList) {
            //The current frame misses this property, so assign it.
            if (!Object.prototype.hasOwnProperty.call(frame.props, key)) {
                frame.props[key] = propList[key];
            }
        }

        //Iterate over all props of the current frame and collect them
        for (key in frame.props) {
            propList[key] = frame.props[key];
        }
    };

    let stateMachine = {
        activeCount: 0,
        elements: [],
        singleFrameElements: []
    }

    let buildParallaxStateMachine = () => {
        let entryTemplate = {
            id: '',
            domElement: null,
            ratio: 0,
            repeat: true,
            keyframes: []
        }

        let _elements = document.getElementsByTagName("*");

        [..._elements].forEach((elem, i) => {
            let { attributes } = elem;
            let matched = Array.from(attributes).some(attr => (/^data-aio--?[0-9]+/g).test(attr.name));
            if (matched) {

                let keyframes = Array.from(attributes).filter(attr => (/^data-aio--?[0-9]+/g).test(attr.name));

                let id = `aio-pl-${i}`;
                elem.setAttribute('data-aio-pl-id', id);

                let entry = { ...entryTemplate };
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
            let observerSettings = {
                root: document,
                rootMargin: 0,
                threshold: 0
            }
            // init observer
            let observer = new IntersectionObserver((entries, observerSettings) => {
                //console.log(entries)
                entries.forEach(entry => {
                    let elem = entry.target;
                    let aioPlId = elem.getAttribute('data-aio-pl-id');

                    let stateMachineObject = stateMachine.elements.filter(o => o.id == aioPlId)[0];

                    let intersected = false;
                    let ratio = entry.intersectionRatio;
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

                            let smoIndex = stateMachine.elements.findIndex(o => o.id == aioPlId);
                            stateMachine.elements.splice(smoIndex, 1);
                        }
                    }
                })
            });

            stateMachine.elements.forEach(elem => {
                observer.observe(elem.domElement);
            })

            // init render
            let fps = 60;
            (function animationUpdate() {
                render();
                //setTimeout(() => {
                    requestAnimationFrame(animationUpdate);
                //}, 1000 / fps);
            }());
        }
    }

    let doc = document.documentElement;
    let scrollTop = 0, scrollTopPrev = -1;
    let render = () => {
        if (stateMachine.activeCount == 0) return;


        scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
        if (scrollTop == scrollTopPrev) return;
        scrollTopPrev = scrollTop;
        document.body.setAttribute("data-scroll-top", scrollTop);

        let entries = stateMachine.elements.filter(entry => entry.ratio > 0);

        entries.forEach(entry => {
            let frames = entry.keyframes;
            let elem = entry.domElement;
            let elemTop = elem.offsetTop;
            //let elemBtm = elemTop + elem.getBoundingClientRect().height;

            //convert offset to absolute
            if (settings.mode == "relative") {
                frames.forEach((f,i) => {
                    let offset = elemTop + f.offset - window.innerHeight;
                    f.absOffset = offset;
                    elem.setAttribute(`data-kf-${i}`, offset);
                })
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
                    })
                    return;
                }

                let progress = (scrollTop - frame1_top) / (frame2_top - frame1_top);

                Object.keys(curFrame.props).forEach(key => {
                    let interpolatedValue = _calcInterpolation(curFrame.props[key].value, nxtFrame.props[key].value, progress);
                    let value = _interpolateString(interpolatedValue);
                    setStyle(elem, key, value);
                })
            }
        })
    }

    let _calcInterpolation = (val1, val2, progress) => {
        var valueIndex;
        var val1Length = val1.length;

        //They both need to have the same length
        if (val1Length !== val2.length) {
            throw 'Can\'t interpolate between "' + val1[0] + '" and "' + val2[0] + '"';
        }

        //Add the format string as first element.
        var interpolated = [val1[0]];

        valueIndex = 1;

        for (; valueIndex < val1Length; valueIndex++) {
            //That's the line where the two numbers are actually interpolated.
            interpolated[valueIndex] = val1[valueIndex] + ((val2[valueIndex] - val1[valueIndex]) * progress);
        }

        return interpolated;
    };

    let _interpolateString = (val) => {
        let i = 1;
        return val[0].replace(/\{\?\}/g, () => val[i++]);
    };

    let setStyle = (elem, key, value) => {
        let style = elem.style;

        let match = key.match(/-./g);
        if (match != null) {
            let uprCs = match[0].toUpperCase();
            let prop = key.replace(match[0], uprCs).replace('-', '');
            style[prop] = value
        } else {
            style[key] = value;
        }
    }

    let main = (_settings) => {
        settings = { ...defaultSettings, ..._settings }

        buildParallaxStateMachine();

        elements = document.querySelectorAll('[data-aio]');

        elements.forEach((elem, i) => {
            elem.setAttribute('data-aio-id', `aio_auto_${i}`);

            let repeat = elem.hasAttribute('data-aio-repeat') || settings.repeat;
            let delay = attrToNum(elem, 'data-aio-delay', settings.delay);
            let offsetTop = getAttrVal(elem, 'data-aio-offset-top', settings.rootMargin.split(" ")[0]);
            let offsetRgt = getAttrVal(elem, 'data-aio-offset-right', settings.rootMargin.split(" ")[1]);
            let offsetBtm = getAttrVal(elem, 'data-aio-offset-bottom', settings.rootMargin.split(" ")[2]);
            let offsetLft = getAttrVal(elem, 'data-aio-offset-left', settings.rootMargin.split(" ")[3]);
            let rootMargin = `${offsetTop} ${offsetRgt} ${offsetBtm} ${offsetLft}`;
            if (elem.hasAttribute("data-aio-offset")) {
                let offsetVal = elem.getAttribute("data-aio-offset");
                if (offsetVal != null && offsetVal.length > 0) {
                    rootMargin = offsetVal;
                }
            }
            let intersected = false;

            let classes = [settings.enterIntersectionClassName];
            let aioType = elem.getAttribute('data-aio');
            if (aioType.length > 0) {
                classes.push(`aio-${aioType}`);
            }

            let intersectionsettings = {
                root: settings.root,
                rootMargin: rootMargin,
                threshold: settings.threshold
            }

            let observer = new IntersectionObserver((entries, intersectionsettings) => {
                entries.forEach(entry => {
                    let ratio = entry.intersectionRatio;
                    let entryTimeOut = 0;

                    if (ratio > 0) {
                        intersected = true;
                        entryTimeOut = setTimeout(() => {
                            classes.forEach(c => {
                                entry.target.classList.add(c);
                            });
                        }, delay);
                    }

                    if (ratio == 0 && repeat) {
                        clearTimeout(entryTimeOut);
                        classes.forEach(c => {
                            entry.target.classList.remove(c);
                        });
                    }

                    if (ratio == 0 && !repeat && intersected) {
                        observer.unobserve(elem);
                        observer.disconnect();
                    }
                })
            });

            observer.observe(elem);
            observers.push(observer);
        });

        if(settings.gridHelper) {
            setTimeout(() => drawGrid(), 1000);
        }
    }

    let drawGrid = () => {
        let gridContainer = document.createElement('div');
        gridContainer.id = "aio-grid-container";

        let h = document.documentElement.scrollHeight;        
        for(let i = 0; i < h; i += 100) {
            let div = document.createElement('div');
            div.className = "aio-row";
            div.innerHTML = `<div class="num">${i}</div><div class="num">${i}</div>`;
            gridContainer.appendChild(div);
        }

        document.body.appendChild(gridContainer);
    }

    let manualObserver = (target, options, callback, repeat) => {
        let defaultOptions = {
            root: document,
            rootMargin: 0,
            threshold: 0,
            ...options
        }
        let observer = new IntersectionObserver((entries, defaultOptions) => {
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
            })
        });

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
    }


    let manualObserverOnce = (target, options, callback) => {
        manualObserver(target, options, callback, false);
    }

    let manualObserverMany = (target, options, callback) => {
        manualObserver(target, options, callback, true);
    }


    let killAllObservers = () => {
        observers.forEach(o => {
            o.disconnect();
        })

        observers = [];
    }

    let resetAnimateIO = () => {
        killAllObservers();
        let _elems = document.querySelectorAll('[data-aio]');
        _elems.forEach((elem, i) => {
            elem.classList.remove(settings.enterIntersectionClassName);

            let aioType = elem.getAttribute('data-aio');
            if (aioType.length > 0) {
                elem.classList.remove(`aio-${aioType}`);
            }
        });
    }

    let destroyAnimateIO = () => {
        resetAnimateIO();
        let _elems = document.querySelectorAll('[data-aio]');
        _elems.forEach((elem, i) => {
            let { attributes } = elem;
            Array.from(attributes).forEach(attr => {
                if (attr.name.indexOf("data-aio") > -1) {
                    elem.removeAttribute(attr.name);
                }
            })
        });
    }

    let restartAnimateIO = () => {
        resetAnimateIO();
        main();
    }

    window.AnimateIO = {
        init: main,
        observe: manualObserverMany,
        observeOnce: manualObserverOnce,
        end: killAllObservers,
        reset: resetAnimateIO,
        restart: restartAnimateIO,
        destroy: destroyAnimateIO
    };
})(window)

console.log('yo')