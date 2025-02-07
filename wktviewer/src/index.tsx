import React from "react";
import ReactDOM from "react-dom";
import { WKTViewer } from "./components";

const el = document.getElementById("wktviewer");
const reactEl = <WKTViewer />;

// if (process.env.NODE_ENV === "production") {
//     ReactDOM.hydrate(reactEl, el);
// } else {
//     ReactDOM.render(reactEl, el);
// }

ReactDOM.render(reactEl, el);
