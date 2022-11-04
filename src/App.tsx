import React from "react";
import { SandpackClient, SandboxInfo } from "@codesandbox/sandpack-client";
import { setupSandpack } from "./lib/astro-sandpack";

function App() {
  return <SandpackPreview />;
}

function SandpackPreview() {
  const iframeRef = React.useRef<HTMLIFrameElement>(null!);
  const clientRef = React.useRef<SandpackClient>(null!);

  React.useEffect(() => {
    async function render() {
      clientRef.current = await setupSandpack(iframeRef.current, [
        {
          name: "/@virtual/test.astro",
          code: `
          ---
          const name = "world"
          ---
          
          <h1>
            Hello {name}!
          </h1>`,
        },
      ]);
    }

    render();
  }, []);

  // React.useEffect(() => {
  //   if (clientRef.current) {
  //     clientRef.current.updatePreview({});
  //   }
  // }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
      }}
    >
      <iframe style={{ width: 600, height: 600 }} ref={iframeRef} />{" "}
    </div>
  );
}

export default App;
