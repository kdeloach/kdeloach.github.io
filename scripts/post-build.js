import fs from "fs";
import { JSDOM, ResourceLoader } from "jsdom";
import path from "path";

const bundleRe = /bundle\.[a-z0-9]+\.js$/;

const siteURL = "http://localhost";
const publicPath = path.resolve("/usr/src/app/public");

class CustomResourceLoader extends ResourceLoader {
    fetch(url, options) {
        const match = bundleRe.exec(url);
        if (match) {
            let relPath = url.replace(siteURL, "");
            if (relPath.startsWith("/")) {
                relPath = relPath.slice(1);
            }
            const fpath = path.resolve(publicPath, relPath);
            this.bundlePath = fpath;
        }
        return null;
    }
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

    const loader = new CustomResourceLoader();
    const dom = new JSDOM(data, {
        runScripts: "dangerously",
        url: siteURL,
        resources: loader,
    });

    if (loader.bundlePath) {
        console.log("Executing: " + loader.bundlePath);
        const bundleCode = fs.readFileSync(loader.bundlePath);
        dom.window.eval(bundleCode.toString());
    } else {
        console.log("[WARN] Bundle not found");
    }

    console.log("Writing: " + fpath);
    fs.writeFileSync(fpath, dom.serialize());
}

const srcDir = path.resolve("public");

walk(srcDir, htmlFiles(withComponents(renderFile)));
