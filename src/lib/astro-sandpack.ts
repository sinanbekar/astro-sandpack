import {
  SandpackClient,
  SandpackErrorMessage,
  SandpackMessage,
} from "@codesandbox/sandpack-client";

// @ts-ignore
import { initialize as loadAstro, transform } from "@astrojs/compiler";
import astroWASM from "@astrojs/compiler/astro.wasm?url";

Promise.all([loadAstro({ wasmURL: astroWASM })]);

const url = "http://localhost:5173/"; // TODO

export async function setupSandpack(
  element: HTMLIFrameElement,
  input: { name: string; code: string }[]
) {
  const entry = input[0];
  let files: any = {};

  files["/@virtual/entry.js"] = {
    code: `export {default} from "${entry.name}.js"`,
  };

  for (const file of input) {
    files[file.name] = { code: file.code };
  }

  files["/@astro/render.js"] = {
    code: `
      import { renderPage, createRenderContext, createBasicEnvironment} from "astro/dist/core/render/index.js";
      const ctx = createRenderContext({
        request: new Request("${url}"),
      });
      const env = createBasicEnvironment({});
      const createAstroModule = (AstroComponent) => ({ default: AstroComponent });

      export default async (Component) => {
        const response = await renderPage(createAstroModule(Component), ctx, env);
          
        const html = await response.text();
        return html;
      }
    `,
  };

  files["/index.js"] = {
    code: `
      import render from "/@astro/render.js";
      import Component from "/@virtual/entry.js";
   
      (async () => {
        const html = await render(Component);
        if (html) {
          document.querySelector('#root').innerHTML = html;
        }
      })()
    `,
  };

  for (const [name, content] of Object.entries(files)) {
    if (name.endsWith(".astro")) {
      const output = await transform((content as any).code, {
        pathname: name,
        sourcefile: name,
        site: url,
        projectRoot: "file://",
        //sourcemap: "inline",
      });

      // TODO: remove this ugly workaround after new compiler version release
      const code = output.code
        .replace(
          output.code
            .split("\nexport const $$metadata")[1]
            .split("\nconst $$Astro")[0],
          ""
        )
        .replace("\nexport const $$metadata", "");

      delete files[name];
      files[`${name}.js`] = { code };
    }
  }

  return new SandpackClient(
    element,
    {
      //@ts-ignore
      template: "vanilla-ts",
      files,
      entry: "/index.js",
      dependencies: {
        astro: "latest",
      },
    },
    {
      showErrorScreen: false,
      showLoadingScreen: false,
      showOpenInCodeSandbox: false,
    }
  );
}
