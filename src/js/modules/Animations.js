import { InitAnimationStateMachine, ObserveStateMachineObjects } from './AnimationStateMachine';
import { DrawGrid } from './Helpers';
import { ObserverSettings } from './Settings';

export const InitAnimations = () => {
    //scan for animateable elements, build the state machine
    InitAnimationStateMachine();

    // init rendering for all the elements
    ObserveStateMachineObjects();

    if (ObserverSettings.gridHelper) {
        setTimeout(() => DrawGrid(), 1000);
    }
}

    