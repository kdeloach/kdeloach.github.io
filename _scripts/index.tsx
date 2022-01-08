import { RootComponent } from "./context";
import registerDateCalcComponents from "./datecalc/components";
import { ComponentMap } from "./types";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import ReactDOMServer from "react-dom/server";

const components: ComponentMap = {};
registerDateCalcComponents(components);
bindComponents(components);

function bindComponents(components: ComponentMap) {
    const nodes = document.querySelectorAll("[data-component]");

    const children: React.ReactPortal[] = [];
    nodes.forEach((node) => {
        const el = node as HTMLElement;
        const compName = el.dataset.component;
        const props = buildProps(el.dataset);

        const comp = components[compName];
        if (!comp) {
            throw new Error("Component not defined: " + compName);
        }

        const reactEl = React.createElement(comp, props);
        const portal = ReactDOM.createPortal(reactEl, el);
        children.push(portal);
    });

    const rootEl = document.createElement("div");
    document.body.appendChild(rootEl);

    const rootComp = React.createElement(RootComponent, {}, children);
    ReactDOM.render(rootComp, rootEl);
}

function buildProps(dataset: DOMStringMap): any {
    const props: any = {};
    for (var k in dataset) {
        if (!k.startsWith("prop")) {
            continue;
        }

        let p = k.replace("prop", "");

        const propType = p[0];
        p = p.slice(1);

        const propName = p[0].toLowerCase() + p.slice(1);

        let propValue: any = dataset[k];
        if (propType == "N") {
            propValue = parseInt(propValue, 10);
        }

        props[propName] = propValue;
    }
    return props;
}
