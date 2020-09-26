let mutationObserver = null;

(() => {
    mutationObserver = new MutationObserver(mutations => {
        subscribers.forEach(subscriber => {
            subscriber.callback(mutations);
        })
    });

    //https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit
    mutationObserver.observe(document, {
        attributes: false,
        childList: true,
        subtree: true,
        characterData: true
    });
})();

let subscribers = [];
// {
//     name: "",
//     callback: method
// };

export const AddMutationListener = (subscriber) => {

    // check if already subscribed
    let alreadySubscribed = subscribers.some(s => s.name == subscriber.name)

    if (!alreadySubscribed) {
        subscribers.push(subscriber);

        // Let's say AnimateIO is initialized at T0 and finds zero elements
        // Then we add a mutation listener after arbitrary delay of 1000ms
        // It's definitely possible that some mutations might have taken place in this time
        // And the elements added in this time didn't get registered
        // To overcome this issue we will manually execute subscriber callback once
        subscriber.callback();
    }
}

export const RemoveMutationListener = (name) => {
    let index = subscribers.findIndex(s => s.name == name);
    if(index > -1) {
        subscribers.splice(index, 1);
    }

    if(subscribers.length == 0) {
        StopMutationObserver();
    }
}


export const StopMutationObserver = () => {
    mutationObserver.disconnect();
}

export const ResetMutationObserver = () => {
    StopMutationObserver();
    subscribers = [];
}