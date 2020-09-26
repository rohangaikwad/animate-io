const DefaultObserverSettings = {
    delay: 0,
    offset: 0,
    mode: 'relative',
    observableAttrName: "data-aiobserve",
    enterIntersectionClassName: "aio-enter",
    exitIntersectionClassName: "aio-exit",
    repeat: false,
    threshold: 0,
    root: null,
    rootMargin: '0px 0px 0px 0px',
    threshold: 0,
    trackMutations: true,
    mutationWatchDelay: 2000
}

export let ObserverSettings = null;

export const OverrideDefaultObserverSettings = (_settings) => {
    ObserverSettings = { ...DefaultObserverSettings, ..._settings };
    return ObserverSettings;
}


const DefaultAnimationSettings = {
    gridHelper: false,
    trackMutations: true,
    fps: null,
    deactivateBelow: 1025
}

export let AnimationSettings = null;

export const OverrideDefaultAnimationSettings = (_settings) => {
    AnimationSettings = { ...DefaultAnimationSettings, ..._settings };
    return AnimationSettings;
}