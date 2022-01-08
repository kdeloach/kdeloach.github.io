import React, { useState } from "react";
import ReactDOM from "react-dom";
import ReactDOMServer from "react-dom/server";

function bindComponents() {
    const nodes = document.querySelectorAll("[data-component]");
    nodes.forEach((node) => {
        const el = node as HTMLElement;
        const comp = componentMap[el.dataset.component];

        const props: any = {};
        for (var k in el.dataset) {
            if (!k.startsWith("prop")) {
                continue;
            }

            let p = k.replace("prop", "");

            const propType = p[0];
            p = p.slice(1);

            const propName = p[0].toLowerCase() + p.slice(1);

            let propValue: any = el.dataset[k];
            if (propType == "N") {
                propValue = parseInt(propValue, 10);
            }

            props[propName] = propValue;
        }

        const reactEl = React.createElement(comp, props);
        ReactDOM.render(reactEl, el);
    });
}

bindComponents();
