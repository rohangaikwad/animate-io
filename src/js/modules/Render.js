import { StateMachine } from './AnimationStateMachine'
import { AnimationSettings } from './Settings';


let scrollTop = 0, scrollTopVH = 0;
let scrollTopPrev = -1;
let doc = document.documentElement;
let raf_id = 0; // Request Animate Frame ID

export const InitRenderer = () => {

    let useFps = true;
    let { fps } = AnimationSettings;

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
        }());
    } else {
        (function animationUpdate() {
            RenderLoop();
            raf_id = requestAnimationFrame(animationUpdate);
        }());
    }
}

let forceRender = false;

export const RenderLoop = () => {
    if (StateMachine.activeCount == 0) return;

    scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

    // Exit render loop if no scrolling happened in this frame
    // Exception: Continue with the render loop if forceRender flag is true
    if (scrollTop == scrollTopPrev && !forceRender) return;
    scrollTopPrev = scrollTop;

    //document.body.setAttribute("data-scroll-top-px", scrollTop);
    forceRender = false;

    let visibleSMObjects = StateMachine.elements.filter(entry => entry.ratio > 0);

    visibleSMObjects.forEach(smObject => {
        let frames = smObject.keyframes;
        let { unitType, domElement } = smObject;
        let elemTop = domElement.offsetTop;

        // if(unitType == 'vh') {
        //     scrollTop = scrollTopVH;
        // }

        let transformedScrollTop = TransformUnitLength(scrollTop, unitType);
        document.body.setAttribute(`data-scroll-top-${unitType}`, scrollTop);

        //convert offset to absolute
        if (smObject.mode == "relative") {
            frames.forEach((f, i) => {
                let offset = elemTop + f.offset;
                //offset -= window.innerHeight;
                f.absOffset = offset;
                domElement.setAttribute(`data-kf-${i}`, offset);
            })
        }

        for (let i = 0; i < frames.length - 1; i++) {
            let curFrame = frames[i];
            let nxtFrame = frames[i + 1];

            let frame1_top = curFrame.absOffset;
            let frame2_top = nxtFrame.absOffset;

            let isBefore = transformedScrollTop < frame1_top;
            let isAfter = transformedScrollTop > frame2_top;

            if (isBefore || isAfter) {
                //console.log(isBefore, isAfter);
                let requiredFrame = isBefore ? curFrame : nxtFrame;

                Object.keys(requiredFrame.props).forEach((key, index) => {
                    let prop = requiredFrame.props[key];
                    let value = _interpolateString(prop.value);
                    setStyle(domElement, key, value);
                })
                return;
            }

            let progress = (transformedScrollTop - frame1_top) / (frame2_top - frame1_top);

            Object.keys(curFrame.props).forEach(key => {
                let interpolatedValue = _calcInterpolation(curFrame.props[key].value, nxtFrame.props[key].value, progress);
                let value = _interpolateString(interpolatedValue);
                setStyle(domElement, key, value);
            })
        }
    });
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
    return val[0].replace(/\{\?\}/g, () => {
        return val[i++];
    });
};

let setStyle = (elem, key, value) => {
    let style = elem.style;

    // Extract "-x", "-m" from string "abc-xyz-mno" 
    let match = key.match(/-./g);
    if (match != null) {
        // convert font-size to fontSize
        let uprCs = match[0].toUpperCase();
        let prop = key.replace(match[0], uprCs).replace('-', '');
        style[prop] = value;   
    } else {
        style[key] = value;     
    }
}

const TransformUnitLength = (val, unit) => {
    let v = val;
    let h = window.innerHeight;
    let w = window.innerWidth;

    let min = (w > h) ? h : w;
    let max = (w < h) ? h : w;

    // relative
    if(unit == 'vh')   v = (val / h)   * 100;
    if(unit == 'vw')   v = (val / w)   * 100;
    if(unit == 'vmin') v = (val / min) * 100;
    if(unit == 'vmax') v = (val / max) * 100;

    return parseFloat(v).toFixed(2);
}


export const StopRenderLoop = () => {
    cancelAnimationFrame(raf_id);
}

// Force rederloop when new elements are added to statemachine
export const ForceRenderLoop = () => {
    forceRender = true;
}