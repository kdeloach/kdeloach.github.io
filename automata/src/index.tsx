import React from "react";
import ReactDOM from "react-dom";
import { AutomataForm } from "./components";

const el = document.getElementById("sketch");
const reactEl = <AutomataForm />;

// if (process.env.NODE_ENV === "production") {
//     ReactDOM.hydrate(reactEl, el);
// } else {
//     ReactDOM.render(reactEl, el);
// }

ReactDOM.render(reactEl, el);
