import type { GenerateCartridgeRequest, GeneratedCartridge } from './schemas'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function titleCasePrompt(prompt: string) {
  const cleaned = prompt.trim().replace(/\s+/g, ' ')

  if (!cleaned) {
    return 'Mystery Cabinet'
  }

  return cleaned
    .split(' ')
    .slice(0, 7)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function hashPrompt(prompt: string) {
  let hash = 0

  for (let index = 0; index < prompt.length; index += 1) {
    hash = (hash * 31 + prompt.charCodeAt(index)) >>> 0
  }

  return hash
}

export function createMockCartridge(input: GenerateCartridgeRequest): GeneratedCartridge {
  const title = `${titleCasePrompt(input.prompt)} DX`
  const escapedTitle = escapeHtml(title)
  const seed = hashPrompt(`${input.prompt}:${input.chaos}:${input.difficulty}`)
  const targetScore = input.difficulty === 'chill' ? 8 : input.difficulty === 'normal' ? 12 : 16
  const hazardCount = input.difficulty === 'chill' ? 3 : input.difficulty === 'normal' ? 5 : 7
  const theme = input.prompt.trim()

  return {
    title,
    subtitle: 'A deterministic mock cartridge for local testing.',
    description:
      'Collect glowing prompt shards while dodging unstable hazards. This mock mode proves the sandbox, save, repair, and export flows without spending API credits.',
    controls: [
      'Move: WASD or Arrow keys',
      'Primary action: hold Space for a shield dash',
      'Mouse/touch: click or tap to dash toward a point',
      'Restart: press R',
    ],
    objective: `Collect ${targetScore} prompt shards before the stability meter reaches zero.`,
    winCondition: `Win by collecting ${targetScore} shards.`,
    loseCondition: 'Lose when you collide with too many unstable hazards.',
    estimatedDifficulty: input.difficulty,
    tags: ['mock', 'canvas', 'arcade', input.difficulty],
    html: `
<div class="pa-game-shell">
  <div class="pa-hud">
    <strong>${escapedTitle}</strong>
    <span id="status">Collect shards. Avoid hazards.</span>
  </div>
  <canvas id="game" width="960" height="540" aria-label="${escapedTitle} game canvas"></canvas>
</div>`.trim(),
    css: `
.pa-game-shell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
  padding: 14px;
  color: #f8fbff;
  background:
    linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px),
    #080a10;
  background-size: 28px 28px;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
.pa-hud {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(93, 246, 255, .45);
  border-radius: 8px;
  background: rgba(10, 16, 25, .82);
  box-shadow: 0 0 18px rgba(93, 246, 255, .18);
}
.pa-hud strong { color: #7dffce; }
.pa-hud span { color: #ffe08a; text-align: right; }
canvas {
  width: 100%;
  height: 100%;
  min-height: 320px;
  border: 1px solid rgba(255, 79, 216, .45);
  border-radius: 8px;
  background: #07080d;
  box-shadow: inset 0 0 30px rgba(255, 79, 216, .12);
}`.trim(),
    js: `
(function () {
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var status = document.getElementById('status');
  var theme = ${JSON.stringify(theme)};
  var seed = ${seed};
  var targetScore = ${targetScore};
  var hazardCount = ${hazardCount};
  var keys = {};
  var pointer = null;
  var game = {};

  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var scale = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = Math.max(640, Math.floor(rect.width * scale));
    canvas.height = Math.max(360, Math.floor(rect.height * scale));
  }

  function reset() {
    game = {
      running: true,
      won: false,
      lost: false,
      score: 0,
      stability: 100,
      player: { x: canvas.width / 2, y: canvas.height / 2, r: 15, vx: 0, vy: 0 },
      dash: 0,
      shard: makeShard(),
      hazards: []
    };
    for (var i = 0; i < hazardCount; i += 1) {
      game.hazards.push(makeHazard());
    }
    status.textContent = 'Collect shards. Avoid hazards.';
  }

  function makeShard() {
    return {
      x: 50 + rand() * Math.max(100, canvas.width - 100),
      y: 70 + rand() * Math.max(100, canvas.height - 140),
      r: 11 + rand() * 7
    };
  }

  function makeHazard() {
    var speed = 1.5 + rand() * 2.5 + ${input.chaos} / 80;
    return {
      x: 40 + rand() * Math.max(80, canvas.width - 80),
      y: 80 + rand() * Math.max(100, canvas.height - 160),
      r: 14 + rand() * 12,
      vx: (rand() > 0.5 ? 1 : -1) * speed,
      vy: (rand() > 0.5 ? 1 : -1) * speed
    };
  }

  function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function update() {
    if (!game.running) return;

    var player = game.player;
    var ax = 0;
    var ay = 0;
    if (keys.ArrowLeft || keys.a || keys.A) ax -= 1;
    if (keys.ArrowRight || keys.d || keys.D) ax += 1;
    if (keys.ArrowUp || keys.w || keys.W) ay -= 1;
    if (keys.ArrowDown || keys.s || keys.S) ay += 1;
    if (keys[' '] || keys.Space) game.dash = Math.max(game.dash, 9);

    if (pointer) {
      var dx = pointer.x - player.x;
      var dy = pointer.y - player.y;
      var length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      ax += dx / length * 1.4;
      ay += dy / length * 1.4;
    }

    var dashPower = game.dash > 0 ? 1.85 : 1;
    game.dash = Math.max(0, game.dash - 1);
    player.vx = (player.vx + ax * 0.7 * dashPower) * 0.88;
    player.vy = (player.vy + ay * 0.7 * dashPower) * 0.88;
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x + player.vx));
    player.y = Math.max(player.r + 38, Math.min(canvas.height - player.r, player.y + player.vy));

    for (var i = 0; i < game.hazards.length; i += 1) {
      var hazard = game.hazards[i];
      hazard.x += hazard.vx;
      hazard.y += hazard.vy;
      if (hazard.x < hazard.r || hazard.x > canvas.width - hazard.r) hazard.vx *= -1;
      if (hazard.y < hazard.r + 38 || hazard.y > canvas.height - hazard.r) hazard.vy *= -1;
      if (distance(player, hazard) < player.r + hazard.r) {
        if (game.dash > 0) {
          hazard.vx *= -1.35;
          hazard.vy *= -1.35;
        } else {
          game.stability -= 0.75;
          hazard.vx *= -1.02;
          hazard.vy *= -1.02;
        }
      }
    }

    if (distance(player, game.shard) < player.r + game.shard.r) {
      game.score += 1;
      game.stability = Math.min(100, game.stability + 5);
      game.shard = makeShard();
      status.textContent = 'Shard captured from "' + theme.slice(0, 34) + '".';
    }

    if (game.score >= targetScore) {
      game.running = false;
      game.won = true;
      status.textContent = 'Victory. Press R to reboot.';
    }

    if (game.stability <= 0) {
      game.running = false;
      game.lost = true;
      status.textContent = 'Cartridge crashed. Press R to reboot.';
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#080a10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(125, 255, 206, 0.11)';
    ctx.lineWidth = 1;
    for (var x = 0; x < canvas.width; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (var y = 0; y < canvas.height; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    var shard = game.shard;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(shard.x, shard.y, shard.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff4bd';
    ctx.stroke();

    for (var i = 0; i < game.hazards.length; i += 1) {
      var hazard = game.hazards[i];
      ctx.fillStyle = '#ff4f7b';
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff9db5';
      ctx.stroke();
    }

    var player = game.player;
    ctx.fillStyle = '#5df6ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    if (game.dash > 0) {
      ctx.strokeStyle = 'rgba(125, 255, 206, 0.72)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 12 + game.dash, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    ctx.fillStyle = '#f8fbff';
    ctx.font = '18px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('Score ' + game.score + ' / ' + targetScore, 18, 30);
    ctx.fillText('Stability ' + Math.max(0, Math.floor(game.stability)) + '%', 180, 30);

    if (!game.running) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = game.won ? '#7dffce' : '#ff8cab';
      ctx.font = 'bold 42px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(game.won ? 'YOU WIN' : 'GAME OVER', canvas.width / 2, canvas.height / 2 - 14);
      ctx.fillStyle = '#f8fbff';
      ctx.font = '20px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 28);
      ctx.textAlign = 'left';
    }
  }

  function frame() {
    update();
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', function () {
    resize();
    reset();
  });
  window.addEventListener('keydown', function (event) {
    if (event.key === ' ' || event.code === 'Space' || event.key.indexOf('Arrow') === 0 || 'wasdWASD'.indexOf(event.key) >= 0) {
      event.preventDefault();
    }
    keys[event.key] = true;
    keys[event.code] = true;
    if (event.key === 'r' || event.key === 'R') reset();
  });
  window.addEventListener('keyup', function (event) {
    keys[event.key] = false;
    keys[event.code] = false;
  });
  canvas.addEventListener('pointerdown', function (event) {
    var rect = canvas.getBoundingClientRect();
    pointer = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  });
  canvas.addEventListener('pointermove', function (event) {
    if (!pointer) return;
    var rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    pointer.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  });
  canvas.addEventListener('pointerup', function () {
    pointer = null;
  });

  resize();
  reset();
  frame();
})();`.trim(),
  }
}
