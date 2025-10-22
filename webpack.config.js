import path from "path";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

const mode = process.env.NODE_ENV || "development";

const baseDir = path.resolve(".");

const config = {
    mode: mode,
    entry: {
        datecalc: "./datecalc/src/index.tsx",
        exapunks: "./exapunks/src/index.tsx",
        gameoflife: "./gameoflife/src/index.tsx",
        lazypass: "./lazypass/src/index.tsx",
        smallville: "./smallville/src/index.ts",
        platecalc: "./platecalc/src/index.tsx",
        platonic: "./platonic/src/index.ts",
        rings: "./rings/src/index.ts",
        wktviewer: "./wktviewer/src/index.tsx",
        wordle: "./wordle/src/index.tsx",
        wordlesolver: "./wordlesolver/src/index.tsx",
        yoto: "./yoto/src/index.ts",
    },
    output: {
        filename: "[name]/bundle.js",
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
            {
                // Add this rule to handle .css files
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [new ForkTsCheckerWebpackPlugin()],
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
};

if (mode !== "production") {
    config.devtool = "eval-cheap-module-source-map";
}

export default config;
