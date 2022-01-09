import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import path from "path";

const mode = process.env.NODE_ENV || "development";

const config = {
  mode: mode,
  entry: "./_scripts/index.tsx",
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/i,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve("assets", "js"),
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
