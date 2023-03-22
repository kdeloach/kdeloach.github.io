import React from "react";
import ReactDOM from "react-dom";
import { PlatecalcForm } from "./components";

const el = document.getElementById("platecalcForm");
const reactEl = <PlatecalcForm />;

// if (process.env.NODE_ENV === "production") {
//     ReactDOM.hydrate(reactEl, el);
// } else {
//     ReactDOM.render(reactEl, el);
// }

ReactDOM.render(reactEl, el);
