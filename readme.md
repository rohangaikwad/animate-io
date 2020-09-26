# AnimateIO
Animate IO is a JavaScript library which allows you to perform animations based on scroll position & the visibility of an element, using IntersectionObserver.

## TOC
1. [Features](#features)
1. [Getting Started](#getting-started)
    1. [Step 1: Add the Script tags](#step-1-add-the-script-tags)
    1. [Step 2: Add the Stylesheet tags](#step-2-add-the-stylesheet-tags-optional) (Optional)
    1. [Step 2: Add HTML attributes](#step-2-add-the-stylesheet-tags-optional)
    1. [Step 4: Initialize AnimateIO](#step-4-initialize-animateio)

&nbsp;

## Features
  1. Observe when a desired HTML Element scrolls in & out of the viewport. 
  1. Add & remove user defined class names from a HTML Element as it scrolls in & out of the viewport.
  1. Lazily add custom attributes once the HTML Element becomes visible in the viewport.
  1. Animate/Transform CSS properties on page scroll (Example: Parallax effect).

&nbsp;

## Getting Started
Adding Animate IO to your website is a straight forward process.

### Step 1: Add the Script tags
Grab the below mentioned script files from the dist folder and include them in the HTML file as follows
> Adding AnimateIO.js to Modern browsers (Chrome, Firefox, Edge, Safari)
```html
<script src="https://cdn.jsdelivr.net/gh/rohangaikwad/animate-io/dist/animate-io.min.js"></script>
```
> Adding AnimateIO.js to Legacy browsers (IE 11)
```html
<!-- Either include the following polyfill bundle from the dist folder -->
<script src="https://cdn.jsdelivr.net/gh/rohangaikwad/animate-io/dist/polyfill.min.js"></script>

<!-- Or  include the necessary polyfills from polyfill.io -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Array.from,Number.isNaN,
Array.prototype.forEach,IntersectionObserver,Object.entries"></script>

<!-- AnimateIO library transformed using Babel -->
<script src="https://cdn.jsdelivr.net/gh/rohangaikwad/animate-io/dist/animate-io-es2015.min.js"></script>
```

### Step 2: Add the Stylesheet tags (Optional)
Grab animate-io.min.css from the dist folder and include it in the HTML file as follows.
Include this file add `fade-in`, `fade-out` animations.
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rohangaikwad/animate-io/dist/animate-io.min.css">
```

### Step 3: Add attributes on elements that you want to animate or observe if they are visible in the viewport
>a. Animate HTML element style

Let's animate the font size of an H1 element from `font-size:14px` when the scrollbar position is <= 100px to `font-size:50px` when the scrollbar position is 300px
```html
<h1 data-aio-100="font-size: 14px" data-aio-300="font-size: 14px">Hello World</h1>
```

>b. Observe if our desired element is visible or scrolls in & out of the viewport

We have to add the attribute `data-aiobserve` on the elements that we want to observe, when they scroll into the viewport.
A class called `aio-enter` gets added to the element when it scrolls into the viewport. 
A class called `aio-exit` gets added to the element when it scrolls out of the viewport and the class `aio-enter` gets removed.
```html
<h1 data-aiobserve>Observe this element only once.</h1>
<h2 data-observe data-aio-repeat>Observe this element as & when it scrolls in/out of the viewport.</h2>
```

### Step 4: Initialize AnimateIO
```js
// a. Initialize AnimateIO to start executing animation on all the valid elements
// where you have added the attribute `data-aio-<number>`
// Only the elements with the attribute signature 'data-aio-<number>' will be animated
AnimateIO.Animate();

// b. Initialize AnimateIO to start observing elements to see if they have scrolled in/out of the viewport
// Only the elements with the attribute 'data-aiobserve' will be tracked
AnimateIO.InitObservers();
```

&nbsp;

## Documentation
### Methods
###### `AnimateIO.InitObservers(options)`
>Start observing all the HTML elements that have the attribute `data-aiobserve`. Add or remove custom classes as defined in the HTML Element by using the attribute `data-aiobserve`, `data-aio-entry-class`, `data-aio-exit-class`. Lazily add attributes defined in the `data-aio-lazy-attr` attribute as a JSON stringified array, to the HTML Element when it becomes visible in the viewport.

parameter|type|description
-|-|-
`options`|object [ObserverOptions](#observeroptions)|[Optional] Change default behaviour by passing arguments via the `options` object

###### `AnimateIO.StopObservers()`
>Stop observing all the HTML elements that have the attribute `data-aiobserve` 

###### `AnimateIO.RestartObservers()`
>Restart observing all the HTML elements that have the attribute `data-aiobserve` 

###### `AnimateIO.DestroyObservers()`
>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. 

###### `AnimateIO.Observe(target, options, callback)`
>This method is similar to [AnimateIO.InitObservers()](#as) but is used to manually observe the target (`HTMLElement`/`NodeList`/`HTMLCollection`) when it becomes visible in the viewport. An IntersectionObserver is attached to the provided target and the callback gets executed whenever the target becomes visible in the viewport.

parameter|type|description
-|-|-
`target`|[`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) / [`NodeList`](https://developer.mozilla.org/en-US/docs/Web/API/NodeList) / [`HTMLCollection`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection)|Use the `target` parameter to observe the desired element(s).
`options`|[`IntersectionObserverInit`](https://www.w3.org/TR/intersection-observer/#dictdef-intersectionobserverinit) dictionary|The options object passed into the IntersectionObserver() constructor let you control the circumstances under which the observer's callback is invoked. It has the following fields: `root`, `rootMargin`, `threshold`
`callback`|function|The function passed in the `callback` parameter, gets executed when the target scrolls in & out of the viewport.

###### `AnimateIO.ObserveOnce(target, options, callback)`
>This method is similar to [AnimateIO.Observe()](#as) but the callback is executed only once. We disconnect the IntersectionObserver once the target becomes visible in the viewport and stop observing it further.

###### `AnimateIO.Animate(options)`
>Start animating CSS properties on all the HTML elements that have the attribute `data-aio-<number>`. 

parameter|type|description
-|-|-
`options`|object [AnimationOptions](#animationoptions)|[Optional] Change default behaviour by passing arguments via the `options` object

###### `AnimateIO.AnimateEnd()`
>Stops animations/transformation all the HTML elements that have the attribute `data-aio-<number>`

###### `AnimateIO.AnimateRestart()`
>Restarts animations/transformation all the HTML elements that have the attribute `data-aio-<number>`

### Options
###### `ObserverOptions`
>ObserverOptions object consists of the below mentioned properties and values.

propertyName|defaultValue|description
-|-|-
`delay`|0|Time delay in performing actions after the target scrolls in and out of the viewport.
`repeat`|false|By default we are disconnecting all the observers once their target becomes visible. To change this default behaviour, set `repeat` to **true**
`enterIntersectionClassName`|'aio-enter'|When the target becomes visible in the viewport, a class named `aio-enter` gets added to the element by default. Use `enterIntersectionClassName` to change this class name to anything else.
`exitIntersectionClassName`|'aio-exit'|When the target goes out of the viewport, a class named `aio-exit` gets added to the element by default. Use `exitIntersectionClassName` to change this class name to anything else.
`trackMutations`|true|Using the [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver), we are checking if any new HTMLElement is added to the page that has the attribute `data-aiobserve` and start observing it. This is especially useful for observing elements that are added after the page finishes loading (Example: New HTML elements added using an AJAX request or using some JavaScript).  To change this default behaviour set `trackMutations` to **false**.
`mutationWatchDelay`|0|Specidy the delay in milliseconds to start looking for new HTML elements.

###### `AnimationOptions`
>AnimationOptions object consists of the below mentioned properties and values.

propertyName|defaultValue|description
-|-|-
`mode`|'relative'|Time delay in performing actions after the target scrolls in and out of the viewport.
`fps`|null|The amount of css property transformations/calculations to perform in a second. The higher the number, the smoother will be the animation, but this will come at the cost of performance. By default this is set to null and the browser chooses the optimal number of calculations to perform per second using [`window.requestAnimationFrame()`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).
`trackMutations`|true|Using the [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver), we are checking if any new HTMLElement is added to the page that has the attribute `data-aiobserve` and start observing it. This is especially useful for observing elements that are added after the page finishes loading (Example: New HTML elements added using an AJAX request or using some JavaScript).  To change this default behaviour set `trackMutations` to **false**.
`mutationWatchDelay`|0|Specidy the delay in milliseconds to start looking for new HTML elements.
`gridHelper`|false|Use this to display horizontal lines every 100 pixels. This can help you to easily set the desired keyframe positions. By default this is set to false.

## Links
https://polyfill.io/v3/url-builder/

https://clontz.org/blog/2014/05/08/git-subtree-push-for-deployment/

https://stackoverflow.com/questions/12644855/how-do-i-reset-a-heroku-git-repository-to-its-initial-state/13403588#13403588
