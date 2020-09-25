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