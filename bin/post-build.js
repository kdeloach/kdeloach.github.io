#!/usr/bin/env node
import fs from "fs";
import { JSDOM } from "jsdom";
import path from "path";

const srcDir = path.resolve("_site");
const bundlePath = path.resolve(srcDir, "assets/js/bundle.js");

const bundleCode = fs.readFileSync(bundlePath).toString();

function walk(dir, cb) {
    fs.readdirSync(dir).forEach(function (fname) {
        var fpath = path.join(dir, fname);
        if (fs.statSync(fpath).isDirectory()) {
            walk(fpath, cb);
        } else {
            cb(fpath);
        }
    });
}

function htmlFiles(cb) {
    return function (fpath) {
        if (fpath.endsWith(".html")) {
            cb(fpath);
        }
    };
}

function withComponents(cb) {
    return function (fpath) {
        const data = fs.readFileSync(fpath);
        if (data.indexOf("data-component") !== -1) {
            cb(fpath, data);
        }
    };
}

function renderFile(fpath, data) {
    console.log("Prerendering React components in " + fpath);
    const dom = new JSDOM(data, {
        runScripts: "dangerously",
    });
    dom.window.eval(bundleCode);
    fs.writeFileSync(fpath, dom.serialize());
}

walk(srcDir, htmlFiles(withComponents(renderFile)));
