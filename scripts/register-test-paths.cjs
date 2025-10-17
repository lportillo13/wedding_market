const Module = require("module");
const path = require("path");

const originalResolveFilename = Module._resolveFilename;
const distDir = path.join(process.cwd(), "dist-tests");

Module._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const absolutePath = path.join(distDir, request.slice(2));
    return originalResolveFilename.call(this, absolutePath, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
