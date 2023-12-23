import React from "react";
import ReactDOM from "react-dom";
import { CodeEditor } from "./components";

const el = document.getElementById("form");
const reactEl = <CodeEditor />;

ReactDOM.render(reactEl, el);
