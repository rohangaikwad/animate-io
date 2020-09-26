import { ObserverSettings } from './Settings';
import { AddClasses, AttrToNum, GetAttrVal, RemoveClasses } from './Helpers';
import { AddMutationListener } from './Mutations';

let ObserverList = [];


export const InitAIObservers = () => {

    // Scan for all AIO Elements & create observer for all of them
    // Multiple observers so we can individually disconnect any element that we want
    ObserveAIOElements();


    // look for new observable objects 
    // delay observing newly added elements for whatever reasons after a delay of X milliseconds
    if (ObserverSettings.trackMutations) {
        setTimeout(() => AddNewAIOElements(), ObserverSettings.mutationWatchDelay);
    }
}

const AddNewAIOElements = () => {
    AddMutationListener({
        name: 'observer_listener',
        callback: (mutations) => {
            // attach observers after a light delay
            setTimeout(() => ObserveAIOElements(), 10);
        }
    })
}

let helperCounter = 0;

const ObserveAIOElements = () => {

    let AIOElements = document.querySelectorAll(`[${ObserverSettings.observableAttrName}]`);
    let elements = Array.from(AIOElements).filter(elem => !elem.hasAttribute('data-aio-id'));

    elements.forEach((elem, i) => {
        elem.setAttribute('data-aio-id', `aio_auto_${++helperCounter}_${i}`);

        let repeat = elem.hasAttribute('data-aio-repeat') || ObserverSettings.repeat;
        let delay = AttrToNum(elem, 'data-aio-delay', ObserverSettings.delay);
        let { rootMargin } = ObserverSettings;
        if (elem.hasAttribute('data-aio-offset')) {
            let offsetVal = elem.getAttribute('data-aio-offset');
            if (offsetVal != null && offsetVal.length > 0) {
                rootMargin = offsetVal;
            }
        }
        let intersected = false;

        let custom_entry_attrVal = GetAttrVal(elem, 'data-aio-enter-class', '');
        let entry_classlist = [ObserverSettings.enterIntersectionClassName, custom_entry_attrVal.split(' ')];
        let aioType = elem.getAttribute(ObserverSettings.observableAttrName);
        if (aioType.length > 0) {
            entry_classlist.push(`aio-${aioType}`);
        }
        entry_classlist = entry_classlist.filter(_class => _class != '');

        let custom_exit_attrVal = GetAttrVal(elem, 'data-aio-exit-class', '');
        let exit_classlist = [ObserverSettings.exitIntersectionClassName, custom_exit_attrVal.split(' ')];
        exit_classlist = exit_classlist.filter(_class => _class != '');

        let attributesApplied = false;
        let lazy_attr_list = [];
        let lazy_attrVal = GetAttrVal(elem, 'data-aio-lazy-attr', null);
        if (lazy_attrVal != null && lazy_attrVal.length > 10) {
            let parsed_array = JSON.parse(lazy_attrVal);
            if (Array.isArray(parsed_array)) {
                if (parsed_array.length > 0) lazy_attr_list.push(...parsed_array);
            }
        }

        let intersectionsettings = {
            root: ObserverSettings.root,
            rootMargin: rootMargin,
            threshold: ObserverSettings.threshold
        }

        let Observer = new IntersectionObserver((entries, _observer) => {
            entries.forEach(entry => {
                let ratio = entry.intersectionRatio;
                let entryTimeOut = 0;

                if (ratio > 0) {
                    intersected = true;

                    // add custom attributes
                    if (!attributesApplied) {
                        attributesApplied = true;
                        lazy_attr_list.forEach(attr => {
                            let key = Object.keys(attr)[0];
                            entry.target.setAttribute(key, attr[key]);
                        });
                    }

                    // add entry class names & remove exit class names
                    entryTimeOut = setTimeout(() => {
                        RemoveClasses(entry.target, exit_classlist);
                        AddClasses(entry.target, entry_classlist);
                    }, delay);
                }

                if (ratio == 0 && repeat) {
                    clearTimeout(entryTimeOut);

                    // add exit class names & remove entry class names
                    RemoveClasses(entry.target, entry_classlist);
                    AddClasses(entry.target, exit_classlist);
                }

                if (ratio == 0 && !repeat && intersected) {
                    _observer.unobserve(elem);
                    _observer.disconnect();
                }
            })
        }, intersectionsettings);

        Observer.observe(elem);
        ObserverList.push(Observer);
    });
}

const ObserveElements = (target, options, callback, repeat) => {
    let defaultOptions = {
        root: null,
        rootMargin: '0px',
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
    KillAllObservers();
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
    ResetAnimateIO();
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
    ResetAnimateIO();
    ObserveAIOElements();
}
