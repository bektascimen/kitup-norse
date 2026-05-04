module.exports = {
  extends: [require.resolve("./index.js")],
  env: { "react-native/react-native": true },
  globals: { __DEV__: "readonly" }
};
