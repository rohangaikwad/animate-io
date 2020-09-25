import { GetAttrVal } from './Helpers';
import { Render } from './Render';

export const StateMachine = {
    activeCount: 0,
    elements: [],
    singleFrameElements: []
}

export const InitAnimationStateMachine = () => {

    // filter out data-aio-<int> elements and push them to the StateMachine so that we can track them later
    populateStateMachine();

    // attach an observer to all the elements added to the State Machine
    // observeStateMachineObjects(fps);
}

// State Machine Object Template
const SMOTemplate = {
    id: '',
    domElement: null,
    ratio: 0,
    repeat: true,
    keyframes: []
}

const populateStateMachine = () => {
    let _elements = document.getElementsByTagName("*");

    [..._elements].forEach((elem, i) => {
        let { attributes } = elem;

        // Match elements with the signature: data-aio-<int>
        // Example: data-aio-1000, data-aio-0
        let matched = Array.from(attributes).some(attr => (/^data-aio--?[0-9]+/g).test(attr.name));
        if (matched) {
            let keyframes = Array.from(attributes).filter(attr => (/^data-aio--?[0-9]+/g).test(attr.name));

            let id = `aio-pl-${i}`;
            elem.setAttribute('data-aio-pl-id', id);

            let entry = { ...SMOTemplate };
            entry.id = id;
            entry.repeat = GetAttrVal(elem, 'data-aio-repeat', true);
            entry.domElement = elem;
            entry.keyframes = processKeyFrames(keyframes, elem);

            if (keyframes.length == 1) {
                StateMachine.singleFrameElements.push(entry);
            } else {
                StateMachine.elements.push(entry);
            }
        }
    });
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
    if (settings.mode == "relative") {
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

export const ObserveStateMachineObjects = () => {
    console.log(StateMachine);
    if (StateMachine.elements.length > 0) {

        let observerSettings = { root: document, rootMargin: 0, threshold: 0 }
        // init observer
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
            })
        });

        StateMachine.elements.forEach(elem => {
            observer.observe(elem.domElement);
        });



        // init render

        let useFps = true;
        if (fps != null) {
            let num = parseFloat(fps);
            useFps = !isNaN(num);
        }

        if (useFps) {
            (function animationTimeoutUpdate() {
                Render()
                setTimeout(() => {
                    requestAnimationFrame(animationTimeoutUpdate);
                }, 1000 / fps);
            }());
        } else {
            (function animationUpdate() {
                Render()
                requestAnimationFrame(animationUpdate);
            }());
        }
    }
}