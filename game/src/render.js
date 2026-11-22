// Ember Pact — renders the duel into the DOM: hands, boards, life and embers,
// selection and targeting, and the win/loss screens. Cards slide in when dealt
// and pop when played (CSS does the motion; this module only sets the classes).
import { SUITS } from './cards.js';

const $ = (id) => document.getElementById(id);

export function cardEl(card, opts = {}) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = `card ${card.suit}${card.kind === 'spell' ? ' spell' : ''}`;
  if (opts.unaffordable) el.classList.add('unaffordable');
  if (opts.selected) el.classList.add('selected');
  if (opts.canAttack) el.classList.add('can-attack');
  if (opts.targetable) el.classList.add('targetable');
  if (opts.justPlayed) el.classList.add('just-played');
  el.dataset.uid = card.uid;
  const stats = card.kind === 'creature'
    ? `<div class="stats"><span class="atk">⚔ ${card.atk}</span><span class="hp">♥ ${card.hp}</span></div>`
    : '';
  el.innerHTML = `<div class="cost">${card.cost}</div>
    <div class="suit ${card.suit}">${suit.glyph}</div>
    <div class="cname">${card.name}</div>
    <div class="ctype">${suit.name} ${card.kind}</div>
    <div class="ctext">${card.text}</div>${stats}`;
  if (card.kind === 'creature' && card.canAttack === false && opts.onBoard) {
    const tag = document.createElement('div');
    tag.className = 'summoning';
    tag.textContent = 'RESTING';
    el.appendChild(tag);
  }
  return el;
}

function backEl() {
  const el = document.createElement('div');
  el.className = 'card back';
  el.innerHTML = '<div class="back-mark">▲</div>';
  return el;
}

export function render(game, ui) {
  const { you, rival } = game;
  $('you-life').textContent = you.life;
  $('rival-life').textContent = rival.life;
  $('you-mana').textContent = '●'.repeat(you.mana) + '○'.repeat(Math.max(0, you.maxMana - you.mana));
  $('rival-mana').textContent = '●'.repeat(rival.mana) + '○'.repeat(Math.max(0, rival.maxMana - rival.mana));
  $('turn-count').textContent = `Turn ${game.turn}`;
  $('turn-text').textContent = game.phase === 'over'
    ? (game.winner === 'you' ? 'Victory!' : 'Defeat')
    : game.active === 'you' ? 'Your turn' : 'Sable is thinking…';
  $('rival-hand-count').textContent = `${rival.hand.length} card${rival.hand.length === 1 ? '' : 's'}`;
  $('you-deck-count').textContent = `deck ${you.deck.length}`;
  $('log').textContent = game.log[0] ?? '';
  $('hint').textContent = ui.hint;
  $('end-turn-btn').disabled = game.phase !== 'play' || game.active !== 'you';

  // Rival hand: face-down backs.
  const rh = $('rival-hand');
  rh.replaceChildren();
  rival.hand.forEach(() => rh.appendChild(backEl()));

  // Boards.
  const rb = $('rival-board');
  rb.replaceChildren();
  if (rival.board.length === 0) rb.innerHTML = '<span class="board-empty">Sable’s side of the table is empty.</span>';
  for (const c of rival.board) {
    const el = cardEl(c, { onBoard: true, targetable: ui.targeting && ui.selectedUid !== null });
    el.addEventListener('click', () => ui.onTarget(c.uid));
    rb.appendChild(el);
  }
  const yb = $('you-board');
  yb.replaceChildren();
  if (you.board.length === 0) yb.innerHTML = '<span class="board-empty">Your side of the table is empty — play a creature.</span>';
  for (const c of you.board) {
    const el = cardEl(c, {
      onBoard: true,
      canAttack: game.phase === 'play' && game.active === 'you' && c.canAttack && !ui.targeting,
      selected: ui.selectedUid === c.uid,
      justPlayed: ui.justPlayedUid === c.uid,
    });
    el.addEventListener('click', () => ui.onBoardCard(c.uid));
    yb.appendChild(el);
  }

  // Your hand.
  const yh = $('you-hand');
  yh.replaceChildren();
  you.hand.forEach((c, i) => {
    const el = cardEl(c, {
      unaffordable: game.phase === 'play' && game.active === 'you' && c.cost > you.mana,
      selected: ui.selectedUid === c.uid,
    });
    el.addEventListener('click', () => ui.onHandCard(c.uid));
    el.title = `Press ${i + 1} to play`;
    yh.appendChild(el);
  });

  // End screen.
  if (game.phase === 'over') {
    const end = $('end-screen');
    const win = game.winner === 'you';
    end.classList.remove('hidden', 'win', 'loss');
    end.classList.add(win ? 'win' : 'loss');
    $('end-emblem').textContent = win ? '▲' : '◆';
    $('end-title').textContent = win ? 'VICTORY' : 'DEFEAT';
    $('end-text').textContent = win
      ? 'Sable bows, and the cinders settle. The pact is yours — the Warden’s flame burns for you now.'
      : 'Sable gathers your embers into her lantern. The pact is lost… but a new duel is only a click away.';
    $('end-stats').textContent = `The duel lasted ${game.turn} turn${game.turn === 1 ? '' : 's'} · Sable fell with ${rival.life} life left · you stood at ${you.life}.`;
    $('table-screen').classList.add('hidden');
  }
}

export function showScreen(name) {
  for (const id of ['title-screen', 'table-screen', 'end-screen']) $(id).classList.add('hidden');
  $(name).classList.remove('hidden');
}
