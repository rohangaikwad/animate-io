import { InitAnimationStateMachine, InitiateAnimationObserver, ObserveStateMachineObjects, ResetStateMachine, StopAnimationObserver, UpdateStateMachine } from './AnimationStateMachine';
import { DrawGrid, QueryMedia } from './Helpers';
import { AddMutationListener, ResetMutationObserver } from './Mutations';
import { InitRenderer, StopRenderLoop } from './Render';
import { AnimationSettings } from './Settings';

let AnimationsInitialized = false;
export const InitAnimations = () => {
    if (AnimationsInitialized) {
        console.error('AnimateIO.Animate() already initialized. To start a new instance, please stop the current animations instance using:\nAnimateIO.StopAnimations();')
    }

    // Check if browser dimensions are correct
    let canInitialize = QueryMedia(AnimationSettings.activeRange);
    if (!canInitialize) {
        console.log(`AnimateIO.Animate() can't initialize since the screen width is outside the range: ${AnimationSettings.activeRange}`);
        return;
    }

    // Initiate animation observer
    InitiateAnimationObserver();

    //scan for animateable elements, build the state machine
    InitAnimationStateMachine();

    // attach an observer to all the elements added to the State Machine
    ObserveStateMachineObjects();

    // init rendering for all the elements
    InitRenderer();

    // look for new animateable objects with the signature data-aio-<int>
    // start looking for new elements after an arbitrary delay of 2 seconds
    if (AnimationSettings.trackMutations) {
        setTimeout(() => AddNewElementsToStateMachine(), AnimationSettings.mutationWatchDelay);
    }

    // show a helper grid and markers for where an animation will start and end
    if (AnimationSettings.gridHelper) {
        setTimeout(() => DrawGrid(), 1000);
    }

    AnimationsInitialized = true;

    // Check for browser resolution changes    
    WatchBrowserResize();
}


const AddNewElementsToStateMachine = () => {
    AddMutationListener({
        name: 'animations_listener',
        callback: (mutations) => {
            UpdateStateMachine();
        }
    })
}


const WatchBrowserResize = () => {
    QueryMedia(AnimationSettings.activeRange, (response) => {
        
        if(response.matches) {
            // Start animations if not already initialized
            if(!AnimationsInitialized) {
                if (response.remove != null) {
                    response.remove();
                    console.log(`Restarting AnimateIO.Animate as browser width is inside the acceptable range: ${AnimationSettings.activeRange}px`);
                    InitAnimations();
                }
            }            
        } else {
            // stop the animations if browser window shrinks below defined width
            if(AnimationsInitialized) {
                console.log(`Stopping AnimateIO.Animate as browser width is outside the range: ${AnimationSettings.activeRange}`);
                KillAnimateInstance();
            }
        }
    });
}

export const KillAnimateInstance = () => {

    // stop rendering
    StopRenderLoop();

    // Stop animation intersection observer
    StopAnimationObserver();

    // disconnect mutation observer
    ResetMutationObserver();

    // reset state machine & remove state machine id attribute
    ResetStateMachine();

    AnimationsInitialized = false;
}

export const RestartAnimateInstance = () => {
    KillAnimateInstance();
    InitAnimations();
}


