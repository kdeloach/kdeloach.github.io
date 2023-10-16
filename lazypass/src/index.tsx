import React from "react";
import ReactDOM from "react-dom";
import { MarkovPasswordGenerator } from "./components";

const el = document.getElementById("form");
const reactEl = <MarkovPasswordGenerator />;

// if (process.env.NODE_ENV === "production") {
//     ReactDOM.hydrate(reactEl, el);
// } else {
//     ReactDOM.render(reactEl, el);
// }

ReactDOM.render(reactEl, el);
