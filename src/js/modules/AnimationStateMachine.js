import { SMO_ID_ATTR_NAME } from './Constants';
import { ForceRenderLoop } from './Render';
import { AnimationSettings } from './Settings';

export const StateMachine = {
    activeCount: 0,
    elements: [],
    singleFrameElements: []
}

export const InitAnimationStateMachine = () => {
    // filter out data-aio-<int> elements and push them to the StateMachine so that we can track them later
    populateStateMachine((count) => {
        console.log(`${count} animateable elements found`);
    });
}

export const UpdateStateMachine = (callback = null) => {
    populateStateMachine((count) => {
        console.log(`${count} new animateable elements found`);
        ObserveStateMachineObjects();

        // Wait for observers to get attached to new elements
        setTimeout(() => ForceRenderLoop(), 100);
    });
}

// State Machine Object Template
const SMOTemplate = {
    id: '',
    domElement: null,
    ratio: 0,
    repeat: true,
    keyframes: [],
    observerAttached: false
}

let populateCounter = 0; // use this counter to generate unique ids for elements

const populateStateMachine = (done) => {
    let AllElements = document.getElementsByTagName("*");

    // Filter elements with the signature: data-aio-<int>
    // Example: data-aio-1000, data-aio-0
    let AIOElements = [...AllElements].filter(elem => {
        let attributes = Object.entries(elem.attributes).map(a => a[1])
        return attributes.some(f => (/^data-aio--?[0-9]+/g).test(f.name));
    });

    // remove elements which have already been added & tracked inside animation state machien list
    let _elements = AIOElements.filter(elem => !elem.hasAttribute(SMO_ID_ATTR_NAME));

    _elements.forEach((elem, i) => {
        let { attributes } = elem;

        let keyframes = Array.from(attributes).filter(attr => (/^data-aio--?[0-9]+/g).test(attr.name));

        let id = `aio-pl-${++populateCounter}-${i}`;
        elem.setAttribute(SMO_ID_ATTR_NAME, id);

        let entry = { ...SMOTemplate };
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
}


const processKeyFrames = (kf, elem) => {
    let frames = [];
    kf.forEach((f, i) => {
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
    if (AnimationSettings.mode == "relative") {
        frames.forEach((f, i) => {
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
}


let AnimationObserver = null;
export const InitiateAnimationObserver = () => {
    let observerSettings = { root: document.documentElement, rootMargin: '0px', threshold: 0 }
    // init observer
    AnimationObserver = new IntersectionObserver((entries, observer) => {
        //console.log(entries)
        entries.forEach(entry => {
            let elem = entry.target;
            let aioPlId = elem.getAttribute(SMO_ID_ATTR_NAME);

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
        })
    }, observerSettings);
}

export const ObserveStateMachineObjects = () => {
    if (StateMachine.elements.length > 0) {
        let newStateMachineElements = StateMachine.elements.filter(elem => !elem.observerAttached);
        newStateMachineElements.forEach(elem => {
            AnimationObserver.observe(elem.domElement);
            elem.observerAttached = true;
        });
    }
}

export const StopAnimationObserver = () => {
    AnimationObserver.disconnect();
}

const RemoveSMOAttributes = () => {
    let StateMachineObjects = [...StateMachine.elements, ...StateMachine.singleFrameElements];

    StateMachineObjects.forEach(smo => {
        smo.domElement.removeAttribute(SMO_ID_ATTR_NAME);
    })
}

export const ResetStateMachine = () => {
    RemoveSMOAttributes();

    StateMachine.activeCount = 0;
    StateMachine.elements = [];
    StateMachine.singleFrameElements = [];
}

