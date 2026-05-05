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
    outline: none;
  }
  canvas {
    display: block;
    max-width: 100%;
    touch-action: none;
    outline: none;
  }
  button, input, select, textarea {
    font: inherit;
  }
${css}
</style>
</head>
<body tabindex="0">
${cartridge.html}
<script>
  (function () {
    var cartridgeCrashed = false;
    var gameplayKeys = {
      ArrowUp: true,
      ArrowDown: true,
      ArrowLeft: true,
      ArrowRight: true,
      KeyW: true,
      KeyA: true,
      KeyS: true,
      KeyD: true,
      w: true,
      a: true,
      s: true,
      d: true,
      W: true,
      A: true,
      S: true,
      D: true
    };

    function send(type, payload) {
      try { parent.postMessage({ type: type, ...payload }, "*"); } catch {}
    }

    function isEditableTarget(target) {
      if (!target || !target.tagName) return false;
      var tagName = String(target.tagName).toLowerCase();
      return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
    }

    function isGameplayKey(event) {
      return gameplayKeys[event.key] || gameplayKeys[event.code] || event.key === " " || event.code === "Space";
    }

    function focusBody() {
      try {
        if (document.body) document.body.focus({ preventScroll: true });
      } catch {
        try { if (document.body) document.body.focus(); } catch {}
      }
    }

    if (document.body) {
      document.body.tabIndex = 0;
    }

    window.addEventListener("focus", function () {
      send("GAME_FOCUSED", {});
    });

    window.addEventListener("blur", function () {
      send("GAME_BLURRED", {});
    });

    document.addEventListener("pointerdown", function () {
      focusBody();
      send("GAME_FOCUSED", {});
    }, true);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        send("GAME_RELEASED", {});
        try { window.blur(); } catch {}
        try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch {}
        return;
      }

      if (isGameplayKey(event) && !isEditableTarget(event.target)) {
        event.preventDefault();
      }
    }, true);

    window.onerror = function(message, source, lineno, colno) {
      cartridgeCrashed = true;
      send("VIBE_CARTRIDGE_ERROR", {
        message: String(message),
        line: lineno,
        column: colno
      });
    };

    window.addEventListener("unhandledrejection", function(event) {
      cartridgeCrashed = true;
      send("VIBE_CARTRIDGE_ERROR", {
        message: String(event.reason || "Unhandled promise rejection")
      });
    });

    setTimeout(function () {
      if (!cartridgeCrashed) {
        send("VIBE_CARTRIDGE_READY", {});
      }
    }, 0);
  })();
</script>
<script>
${js}
</script>
</body>
</html>`
}
