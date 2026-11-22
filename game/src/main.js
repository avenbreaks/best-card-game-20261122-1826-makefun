// Ember Pact — boot and input. Click a card to select it, click again (or a
// target) to use it; creatures attack by selecting them, then a target.
// Keyboard: 1–5 plays a hand card, Enter ends the turn, Escape cancels.
import { createGame, playCard, attack, endTurn, say } from './state.js';
import { render, showScreen } from './render.js';
import { takeAiTurn } from './ai.js';
import { sfx } from './audio.js';
import { presetGame } from './shots.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? '7') || 7;
const shot = params.get('shot');

let game = shot ? presetGame(shot, seed) : createGame(seed);
let selectedUid = null; // a hand card or a board creature awaiting a target
let justPlayedUid = null;
let aiBusy = false;

const ui = {
  hint: 'Play a card, then end your turn.',
  get targeting() { return selectedUid !== null && game.you.board.some((c) => c.uid === selectedUid); },
  get selectedUid() { return selectedUid; },
  get justPlayedUid() { return justPlayedUid; },
  onHandCard(uid) { selectHandCard(uid); },
  onBoardCard(uid) { selectBoardCard(uid); },
  onTarget(uid) { attackTarget(uid); },
};

function refresh() {
  render(game, ui);
}

function clearSelection() {
  selectedUid = null;
  ui.hint = 'Play a card, then end your turn.';
}

function selectHandCard(uid) {
  if (game.phase !== 'play' || game.active !== 'you' || aiBusy) return;
  const card = game.you.hand.find((c) => c.uid === uid);
  if (!card) return;
  if (card.cost > game.you.mana) { ui.hint = `Not enough embers for ${card.name} (${card.cost} needed).`; refresh(); return; }
  if (card.kind === 'spell' && card.effect === 'buffall' && game.you.board.length === 0) {
    ui.hint = 'Stone Wall needs a creature on your side first.'; refresh(); return;
  }
  const msg = playCard(game, 'you', uid);
  if (msg) {
    sfx.play();
    justPlayedUid = card.kind === 'creature' ? uid : null;
    setTimeout(() => { justPlayedUid = null; refresh(); }, 450);
    say(game, msg);
    clearSelection();
    afterAction();
  }
  refresh();
}

function selectBoardCard(uid) {
  if (game.phase !== 'play' || game.active !== 'you' || aiBusy) return;
  const c = game.you.board.find((x) => x.uid === uid);
  if (!c) return;
  if (selectedUid === uid) { clearSelection(); refresh(); return; }
  if (!c.canAttack) { ui.hint = `${c.name} is resting — it just arrived.`; refresh(); return; }
  selectedUid = uid;
  ui.hint = `Choose a target for ${c.name} — a rival creature, or Sable herself. Click her portrait’s life to strike her directly.`;
  refresh();
}

function attackTarget(uid) {
  if (!ui.targeting) return;
  const msg = attack(game, 'you', selectedUid, uid);
  if (msg) { sfx.hit(); say(game, msg); clearSelection(); afterAction(); }
  refresh();
}

function afterAction() {
  refresh();
  if (game.phase === 'over') { finish(); return; }
}

function finish() {
  refresh();
  if (game.winner === 'you') sfx.win(); else sfx.lose();
}

async function endTurnClick() {
  if (game.phase !== 'play' || game.active !== 'you' || aiBusy) return;
  clearSelection();
  aiBusy = true;
  endTurn(game);
  refresh();
  if (game.phase === 'over') { aiBusy = false; finish(); return; }
  await takeAiTurn(game, (msg) => { if (msg) say(game, msg); refresh(); });
  aiBusy = false;
  if (game.phase === 'over') finish();
  refresh();
}

// The rival's portrait is the "attack the hero" target.
document.getElementById('rival-panel').addEventListener('click', () => {
  if (ui.targeting) attackTarget('hero');
});

document.getElementById('end-turn-btn').addEventListener('click', endTurnClick);
document.getElementById('start-btn').addEventListener('click', () => {
  game.phase = 'play';
  sfx.play();
  showScreen('table-screen');
  refresh();
});
document.getElementById('again-btn').addEventListener('click', () => {
  game = createGame((Math.random() * 1e9) | 0);
  game.phase = 'play';
  selectedUid = null;
  showScreen('table-screen');
  refresh();
});

document.addEventListener('keydown', (e) => {
  if (game.phase !== 'play' || game.active !== 'you' || aiBusy) return;
  if (e.key >= '1' && e.key <= '5') {
    const card = game.you.hand[Number(e.key) - 1];
    if (card) selectHandCard(card.uid);
  } else if (e.key === 'Enter') {
    endTurnClick();
  } else if (e.key === 'Escape') {
    clearSelection(); refresh();
  }
});

// Boot into the right screen for the shot, or the title for a real player.
// Screenshot runs freeze CSS animations mid-flight, so a shot renders with
// every animation switched off: the still frame is the finished layout.
if (shot) {
  const still = document.createElement('style');
  still.textContent = '*{animation:none!important;transition:none!important}';
  document.head.appendChild(still);
}
if (shot === 'start') {
  showScreen('title-screen');
} else if (shot === 'win' || shot === 'loss') {
  showScreen('end-screen');
  render(game, ui);
  // The end screen renders from state; fill its text now.
  document.getElementById('end-screen').classList.add(game.winner === 'you' ? 'win' : 'loss');
  document.getElementById('end-emblem').textContent = game.winner === 'you' ? '▲' : '◆';
  document.getElementById('end-title').textContent = game.winner === 'you' ? 'VICTORY' : 'DEFEAT';
  document.getElementById('end-text').textContent = game.winner === 'you'
    ? 'Sable bows, and the cinders settle. The pact is yours — the Warden’s flame burns for you now.'
    : 'Sable gathers your embers into her lantern. The pact is lost… but a new duel is only a click away.';
  document.getElementById('end-stats').textContent = `The duel lasted ${game.turn} turns · Sable fell with ${game.rival.life} life left · you stood at ${game.you.life}.`;
} else {
  showScreen('table-screen');
  if (shot === 'table') ui.hint = 'Turn 4 — the table is crowded and the embers are high.';
}
refresh();
