export const GetAttrVal = (elem, attr, defaultValue) => {
    let val = defaultValue;
    if (elem.hasAttribute(attr)) {
        let attrval = elem.getAttribute(attr);
        if (attrval != null) {
            val = attrval;
        }
    }
    return val;
}

export const AttrToNum = (elem, attr, defaultValue) => {
    let val = GetAttrVal(elem, attr, defaultValue);
    let num = parseInt(val);
    return Number.isNaN(num) ? defaultValue : num;
}

export const DrawGrid = () => {
    let gridContainer = document.createElement('div');
    gridContainer.id = "aio-grid-container";

    let h = document.documentElement.scrollHeight;
    for (let i = 0; i < h; i += 100) {
        let div = document.createElement('div');
        div.className = "aio-row";
        div.innerHTML = `<div class="num">${i}</div><div class="num">${i}</div>`;
        gridContainer.appendChild(div);
    }

    document.body.appendChild(gridContainer);
}

export const AddClasses = (elem, classList) => {
    classList.forEach(_className => {
        elem.classList.add(_className);
    });
}

export const RemoveClasses = (elem, classList) => {
    classList.forEach(_className => {
        elem.classList.remove(_className);
    });
}


export const QueryMedia = (mediaQuery, callback = null) => {
    let query = window.matchMedia(mediaQuery);

    if (callback == null) {
        return query.matches;
    } else {
        callback({ matches: query.matches, remove: null });



        let ObserveResult = (matches) => {
            callback({
                matches: matches,
                // use removeListener to support legacy browsers like 11 
                //remove: () => query.removeEventListener('change', handler)
                remove: () => query.removeListener(handler) 
            });
        }

        let handler = (e) => {
            ObserveResult(e.matches)
        }

        // use addListener to support legacy browsers like 11
        query.addListener(handler);
        //query.addEventListener('change', handler);

    }
}