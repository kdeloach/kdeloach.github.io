import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import path from "path";

const mode = process.env.NODE_ENV || "development";

const baseDir = path.resolve("./content/posts");

const config = {
    mode: mode,
    entry: {
        "datecalc/dist/bundle": path.resolve(baseDir, "datecalc/src/index.tsx"),
        "wordle/dist/bundle": path.resolve(baseDir, "wordle/src/index.tsx"),
        "wordlesolver/dist/bundle": path.resolve(baseDir, "wordlesolver/src/index.tsx"),
        "gameoflife/dist/bundle": path.resolve(baseDir, "gameoflife/src/index.tsx"),
    },
    output: {
        filename: "[name].js",
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
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            async: false,
        }),
    ],
};

if (mode !== "production") {
    config.devtool = "eval-cheap-module-source-map";
}

export default config;
