import fs from "fs";
import { JSDOM } from "jsdom";
import path from "path";

const srcDir = path.resolve("public");

const bundlePath = findBundle(path.resolve(srcDir, "js"));
console.log("Loading bundle " + bundlePath);

const bundleCode = fs.readFileSync(bundlePath).toString();

function findBundle(dir) {
    let match = null;
    walk(dir, (fpath, fname) => {
        if (fname.startsWith("bundle.")) {
            match = fpath;
        }
    });
    return match;
}

function walk(dir, cb) {
    fs.readdirSync(dir).forEach(function (fname) {
        var fpath = path.join(dir, fname);
        if (fs.statSync(fpath).isDirectory()) {
            walk(fpath, cb);
        } else {
            cb(fpath, fname);
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
