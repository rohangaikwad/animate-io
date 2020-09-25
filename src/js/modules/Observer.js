import { ObserverSettings } from './Settings';
import { AttrToNum, GetAttrVal } from './Helpers';

let elements = null;
let ObserverList = [];

export const ObserveAIOElements = () => {

    elements = document.querySelectorAll(`[${ObserverSettings.observableAttrName}]`);

    elements.forEach((elem, i) => {
        elem.setAttribute('data-aio-id', `aio_auto_${i}`);

        let repeat = elem.hasAttribute('data-aio-repeat') || ObserverSettings.repeat;
        let delay = AttrToNum(elem, 'data-aio-delay', ObserverSettings.delay);
        let offsetTop = GetAttrVal(elem, 'data-aio-offset-top', ObserverSettings.rootMargin.split(" ")[0]);
        let offsetRgt = GetAttrVal(elem, 'data-aio-offset-right', ObserverSettings.rootMargin.split(" ")[1]);
        let offsetBtm = GetAttrVal(elem, 'data-aio-offset-bottom', ObserverSettings.rootMargin.split(" ")[2]);
        let offsetLft = GetAttrVal(elem, 'data-aio-offset-left', ObserverSettings.rootMargin.split(" ")[3]);
        let rootMargin = `${offsetTop} ${offsetRgt} ${offsetBtm} ${offsetLft}`;
        if (elem.hasAttribute("data-aio-offset")) {
            let offsetVal = elem.getAttribute("data-aio-offset");
            if (offsetVal != null && offsetVal.length > 0) {
                rootMargin = offsetVal;
            }
        }
        let intersected = false;

        let classes = [];
        let aioType = elem.getAttribute(ObserverSettings.observableAttrName);
        if (aioType.length > 0) {
            classes.push(`aio-${aioType}`);
        }

        let intersectionsettings = {
            root: ObserverSettings.root,
            rootMargin: rootMargin,
            threshold: ObserverSettings.threshold
        }

        let observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                let ratio = entry.intersectionRatio;
                let entryTimeOut = 0;

                if (ratio > 0) {
                    intersected = true;
                    entryTimeOut = setTimeout(() => {
                        entry.target.classList.remove(ObserverSettings.exitIntersectionClassName);
                        entry.target.classList.add(ObserverSettings.enterIntersectionClassName);
                        classes.forEach(c => {
                            entry.target.classList.add(c);
                        });
                    }, delay);
                }

                if (ratio == 0 && repeat) {
                    clearTimeout(entryTimeOut);
                    entry.target.classList.remove(ObserverSettings.enterIntersectionClassName);
                    classes.forEach(c => {
                        entry.target.classList.remove(c);
                    });
                    entry.target.classList.add(ObserverSettings.exitIntersectionClassName);
                }

                if (ratio == 0 && !repeat && intersected) {
                    observer.unobserve(elem);
                    observer.disconnect();
                }
            })
        }, intersectionsettings);

        observer.observe(elem);
        ObserverList.push(observer);
    });
}

const ObserveElements = (target, options, callback, repeat) => {
    let defaultOptions = {
        root: document,
        rootMargin: 0,
        threshold: 0,
        ...options
    }
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
        })
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
}

export const ObserveElementsOnce = (target, options, callback) => {
    ObserveElements(target, options, callback, false);
}

export const ObserveElementsContinuous = (target, options, callback) => {
    ObserveElements(target, options, callback, true);
}



export const KillAllObservers = () => {
    ObserverList.forEach(o => {
        o.disconnect();
    });

    ObserverList = [];
}

export const ResetAnimateIO = () => {
    killAllObservers();
    let _elems = document.querySelectorAll(`[${ObserverSettings.observableAttrName}]`);
    _elems.forEach((elem, i) => {
        elem.classList.remove(Settings.enterIntersectionClassName);

        let aioType = elem.getAttribute(ObserverSettings.observableAttrName);
        if (aioType.length > 0) {
            elem.classList.remove(`aio-${aioType}`);
        }
    });
}

export const DestroyAnimateIO = () => {
    resetAnimateIO();
    let _elems = document.querySelectorAll(`[${ObserverSettings.observableAttrName}]`);
    _elems.forEach((elem, i) => {
        let { attributes } = elem;
        Array.from(attributes).forEach(attr => {
            if (attr.name.indexOf(ObserverSettings.observableAttrName) > -1) {
                elem.removeAttribute(attr.name);
            }
        })
    });
}

export const RestartAnimateIO = () => {
    resetAnimateIO();
    main();
}