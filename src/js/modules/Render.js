import { StateMachine } from './AnimationStateMachine'


let scrollTop = 0;
let scrollTopPrev = -1;
let doc = document.documentElement;

export const Render = () => {
    if (StateMachine.activeCount == 0) return;

    scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    if (scrollTop == scrollTopPrev) return;
    scrollTopPrev = scrollTop;
    document.body.setAttribute("data-scroll-top", scrollTop);

    let entries = StateMachine.elements.filter(entry => entry.ratio > 0);

    entries.forEach(entry => {
        let frames = entry.keyframes;
        let elem = entry.domElement;
        let elemTop = elem.offsetTop;

        //convert offset to absolute
        if (settings.mode == "relative") {
            frames.forEach((f, i) => {
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
        style[prop] = value
    } else {
        style[key] = value;
    }
}

