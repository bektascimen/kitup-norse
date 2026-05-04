// Consumer must install `eslint-config-next` for `next/core-web-vitals` to resolve.
module.exports = {
  extends: [require.resolve("./index.js"), "next/core-web-vitals"]
};
