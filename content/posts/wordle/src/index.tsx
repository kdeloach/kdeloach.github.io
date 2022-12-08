import { WordleForm } from "./components";
import React from "react";
import ReactDOM from "react-dom";

const el = document.getElementById("wordleForm");
const reactEl = <WordleForm />;

// if (process.env.NODE_ENV === "production") {
//     ReactDOM.hydrate(reactEl, el);
// } else {
//     ReactDOM.render(reactEl, el);
// }

ReactDOM.render(reactEl, el);
