/**
 * ESBuild plugins for Zotero environment
 * Provides shims for Node.js modules that googleapis tries to require
 */

import type { Plugin } from "esbuild";

/**
 * Plugin to replace dynamic requires of Node.js modules with Zotero's require
 */
export const nodeModulesPlugin: Plugin = {
  name: "node-modules-shim",
  setup(build) {
    // Intercept child_process requires and replace with a shim
    build.onResolve({ filter: /^child_process$/ }, (args) => {
      return {
        path: args.path,
        namespace: "node-shim",
      };
    });

    build.onLoad({ filter: /.*/, namespace: "node-shim" }, (args) => {
      // Provide a minimal shim that returns empty objects
      // googleapis uses child_process for some features we don't need
      return {
        contents: `
          // Shim for ${args.path}
          module.exports = new Proxy({}, {
            get(target, prop) {
              console.warn('Attempted to use ${args.path}.', prop, '- not available in Zotero');
              return () => {};
            }
          });
        `,
        loader: "js",
      };
    });
  },
};
