const DefaultObserverSettings = {
    delay: 0,
    observableAttrName: "data-aiobserve",
    enterIntersectionClassName: "aio-enter",
    exitIntersectionClassName: "aio-exit",
    repeat: false,
    trackMutations: true,
    mutationWatchDelay: 0,
    root: null,
    rootMargin: '0px 0px 0px 0px',
    threshold: 0
}

export let ObserverSettings = null;

export const OverrideDefaultObserverSettings = (_settings) => {
    ObserverSettings = { ...DefaultObserverSettings, ..._settings };
    return ObserverSettings;
}


const DefaultAnimationSettings = {
    mode: 'relative',
    fps: null,
    activeRange: '(min-width: 1025px)',
    trackMutations: true,
    mutationWatchDelay: 0,
    gridHelper: false
}

export let AnimationSettings = null;

export const OverrideDefaultAnimationSettings = (_settings) => {
    AnimationSettings = { ...DefaultAnimationSettings, ..._settings };
    return AnimationSettings;
}