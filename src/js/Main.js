import { OverrideDefaultObserverSettings, OverrideDefaultAnimationSettings } from './modules/Settings';
import { ObserveElementsOnce, ObserveElementsContinuous, KillAllObservers, RestartAnimateIO, DestroyAnimateIO, InitAIObservers } from './modules/ObserverManager';
import { InitAnimations, KillAnimateInstance, RestartAnimateInstance } from './modules/AnimationManager';

((window) => {
    let InitObservers = (_settings) => {

        // override settings passed from initialization
        OverrideDefaultObserverSettings(_settings);

        // scan for observable elements, attach intersection observer to each
        InitAIObservers();
    }

    let Animate = (_settings) => {

        // override settings passed from initialization
        OverrideDefaultAnimationSettings(_settings);

        // scan for animateable elements, build the state machine, init rendering
        InitAnimations();
    }

    window.AnimateIO = {
        InitObservers: InitObservers,
        Observe: ObserveElementsContinuous,
        ObserveOnce: ObserveElementsOnce,
        StopObservers: KillAllObservers,
        DestroyObservers: DestroyAnimateIO,
        RestartObservers: RestartAnimateIO,
        Animate: Animate,
        AnimateEnd: KillAnimateInstance,
        AnimateRestart: RestartAnimateInstance
    };
})(window);