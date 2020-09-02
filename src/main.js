((window) => {

    let observers = [];

    let defaultSettings = {
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

    let main = (_settings) => {
        settings = { ...defaultSettings, ..._settings }
        console.log("hello");

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