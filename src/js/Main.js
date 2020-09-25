import { OverrideDefaultObserverSettings, OverrideDefaultAnimationSettings } from './modules/Settings';
import { ObserveAIOElements, ObserveElementsOnce, ObserveElementsContinuous, KillAllObservers, RestartAnimateIO, DestroyAnimateIO } from './modules/Observer';
import { InitAnimations } from './modules/Animations';

((window) => {
    let InitObservers = (_settings) => {

        // override settings passed from initialization
        OverrideDefaultObserverSettings(_settings);

        // scan for observable elements, attach intersection observer to each
        ObserveAIOElements();
    }

    let Animate = (_settings) => {

        // override settings passed from initialization
        OverrideDefaultAnimationSettings(_settings);

        // scan for animateable elements, build the state machine, init rendering
        InitAnimations();
    }

    window.AnimateIO = {
        InitObservers: InitObservers,
        Animate: Animate,
        observe: ObserveElementsContinuous,
        observeOnce: ObserveElementsOnce,
        stop: KillAllObservers,
        reset: RestartAnimateIO,
        restart: RestartAnimateIO,
        destroy: DestroyAnimateIO
    };
})(window);