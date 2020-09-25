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
}

export let ObserverSettings = null;

export const OverrideDefaultObserverSettings = (_settings) => {
    ObserverSettings = { ...DefaultObserverSettings, ..._settings };
    return ObserverSettings;
}


const DefaultAnimationSettings = {
    gridHelper: false,
    mode: 'relative',
    fps: null
}

export let AnimationSettings = null;

export const OverrideDefaultAnimationSettings = (_settings) => {
    AnimationSettings = { ...DefaultAnimationSettings, ..._settings };
    return AnimationSettings;
}