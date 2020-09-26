# AnimateIO
Animate IO is a JavaScript library which allows you to perform animations based on scroll position & the visibility of an element, using IntersectionObserver.

## TOC
1. [Features](#features)
1. [Getting Started](#getting-started)
    1. [Step 1: Add the Script tags](#step-1-add-the-script-tags)
    1. [Step 2: Add the Stylesheet tags](#step-2-add-the-stylesheet-tags-optional) (Optional)
    1. [Step 2: Add HTML attributes](#step-2-add-the-stylesheet-tags-optional)
    1. [Step 4: Initialize AnimateIO](#step-4-initialize-animateio)
   
   
   

## Features
  1. Observe when a desired HTML Element scrolls in & out of the viewport. 
  1. Add & remove user defined class names from a HTML Element as it scrolls in & out of the viewport.
  1. Lazily add custom attributes once the HTML Element becomes visible in the viewport.
  1. Transform CSS properties on page scroll like parallax effects.
   
   
   

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
Grab animate-io.min.css from the dist folder and include it in the HTML file as follows
```html
<link rel="stylesheet" href="animate-io.min.css">
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


## Links
https://polyfill.io/v3/url-builder/

https://clontz.org/blog/2014/05/08/git-subtree-push-for-deployment/

https://stackoverflow.com/questions/12644855/how-do-i-reset-a-heroku-git-repository-to-its-initial-state/13403588#13403588
