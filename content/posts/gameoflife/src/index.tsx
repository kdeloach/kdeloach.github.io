import { GameOfLife } from "./components";
import React from "react";
import ReactDOM from "react-dom";

const el = document.getElementById("gameOfLife");
const reactEl = <GameOfLife />;

if (process.env.NODE_ENV === "production") {
    ReactDOM.hydrate(reactEl, el);
} else {
    ReactDOM.render(reactEl, el);
}
