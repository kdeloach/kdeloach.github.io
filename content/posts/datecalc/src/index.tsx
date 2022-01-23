import { DateCalcForm } from "./components";
import React from "react";
import ReactDOM from "react-dom";

const el = document.getElementById("dateCalcForm");
const reactEl = <DateCalcForm initial="12/25/2021 + 7 days" />;

if (process.env.NODE_ENV === "production") {
    ReactDOM.hydrate(reactEl, el);
} else {
    ReactDOM.render(reactEl, el);
}
