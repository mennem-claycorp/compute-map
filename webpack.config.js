const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./src/app.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "os-map.min.js",
  },
  mode: "production",
  devtool: "source-map",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/,
        oneOf: [
          {
            // Convert only map.css to string
            include: path.resolve(__dirname, "src/styles/map.css"),
            use: [
              {
                loader: "raw-loader",
                options: {
                  esModule: false,
                },
              },
            ],
          },
          {
            use: ["style-loader", "css-loader"],
          },
        ],
      },
      {
        test: /\.svg$/,
        type: "asset/inline",
      },
      {
        test: /\.html$/,
        use: "raw-loader",
      },
    ],
  },
};
