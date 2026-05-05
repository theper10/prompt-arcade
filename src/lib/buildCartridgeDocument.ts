import type { AiCartridge } from '../types/cartridge'

function neutralizeClosingTag(value: string, tag: 'script' | 'style') {
  return value.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`)
}

export function buildCartridgeDocument(cartridge: AiCartridge) {
  const css = neutralizeClosingTag(cartridge.css, 'style')
  const js = neutralizeClosingTag(cartridge.js, 'script')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body {
    width: 100%;
    min-height: 100%;
    margin: 0;
    overflow: hidden;
    background: #07080d;
    color: #f8fbff;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  canvas {
    display: block;
    max-width: 100%;
    touch-action: none;
  }
  button, input, select, textarea {
    font: inherit;
  }
${css}
</style>
</head>
<body>
${cartridge.html}
<script>
  (function () {
    function send(type, payload) {
      try { parent.postMessage({ type: type, ...payload }, "*"); } catch {}
    }

    window.onerror = function(message, source, lineno, colno) {
      send("VIBE_CARTRIDGE_ERROR", {
        message: String(message),
        line: lineno,
        column: colno
      });
    };

    window.addEventListener("unhandledrejection", function(event) {
      send("VIBE_CARTRIDGE_ERROR", {
        message: String(event.reason || "Unhandled promise rejection")
      });
    });

    setTimeout(function () {
      send("VIBE_CARTRIDGE_READY", {});
    }, 0);
  })();
</script>
<script>
${js}
</script>
</body>
</html>`
}
