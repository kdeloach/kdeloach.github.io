import path from "path";

const mode = process.env.NODE_ENV || "development";

const baseDir = path.resolve(".");

const config = {
    mode: mode,
    entry: "./src/index.tsx",
    output: {
        filename: "bundle.js",
        path: baseDir,
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/i,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
};

if (mode !== "production") {
    config.devtool = "eval-cheap-module-source-map";
}

export default config;
