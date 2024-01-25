import { DateCalcForm } from "./components";
import React from "react";
import ReactDOM from "react-dom";

const today = new Date().toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

const el = document.getElementById("dateCalcForm");
const reactEl = <DateCalcForm initial={`${today} + 7 days`} />;

// if (process.env.NODE_ENV === "production") {
//     ReactDOM.hydrate(reactEl, el);
// } else {
//     ReactDOM.render(reactEl, el);
// }

ReactDOM.render(reactEl, el);
