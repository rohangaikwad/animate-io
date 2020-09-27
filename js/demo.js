const removeClass = (nodeList, className) => {
    nodeList.forEach(node => {
        node.classList.remove(className);
    })
}

const addClass = (nodeList, className) => {
    nodeList.forEach(node => {
        node.classList.add(className);
    })
}

let tabHeaders = document.querySelectorAll('.get-code > .tabs li');
let tabWindows = document.querySelectorAll('.get-code > .tabs-content li');
tabHeaders.forEach((elem,i) => {
    elem.addEventListener('click', () => {
        removeClass(tabHeaders, 'active');
        elem.classList.add('active');
        
        removeClass(tabWindows, 'active');
        tabWindows[i].classList.add('active');
    })
})