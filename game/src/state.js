// Ember Pact — rules and state. One duel: two 30-life duelists, embers (mana)
// that grow by 1 each turn up to 10, a 20-card deck, hands of 4. Creatures fight
// on the table; spells strike at once. A creature cannot attack the turn it is
// played. Reduce the rival to 0 life to win.
import { buildDeck, CARD_BY_ID } from './cards.js';
import { makeRng, shuffle } from './rng.js';

export const MAX_LIFE = 30;
export const MAX_MANA = 10;

let nextUid = 1;

export function newDuelist(name) {
  return { name, life: MAX_LIFE, mana: 0, maxMana: 0, deck: [], hand: [], board: [] };
}

export function createGame(seed) {
  const rng = makeRng(seed ?? ((Math.random() * 1e9) | 0));
  const game = {
    rng,
    turn: 1,
    phase: 'title', // title | play | over
    active: 'you', // whose turn it is
    winner: null,
    you: newDuelist('Ashcaller'),
    rival: newDuelist('Sable'),
    log: [],
  };
  for (const side of ['you', 'rival']) {
    game[side].deck = shuffle(buildDeck(), rng);
    for (let i = 0; i < 4; i++) drawCard(game, side);
  }
  startTurn(game, 'you');
  return game;
}

export function drawCard(game, side) {
  const p = game[side];
  if (p.deck.length === 0) return null; // empty deck: the pact simply holds
  const id = p.deck.pop();
  const card = { uid: nextUid++, ...CARD_BY_ID[id] };
  p.hand.push(card);
  return card;
}

export function startTurn(game, side) {
  const p = game[side];
  game.active = side;
  p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
  p.mana = p.maxMana;
  for (const c of p.board) c.canAttack = true;
  drawCard(game, side);
  say(game, side === 'you' ? 'Your turn — the embers are yours.' : 'Sable takes the table.');
}

export function say(game, text) {
  game.log.unshift(text);
  if (game.log.length > 3) game.log.length = 3;
}

function heal(game, side, n) {
  const p = game[side];
  const before = p.life;
  p.life = Math.min(MAX_LIFE, p.life + n);
  return p.life - before;
}

function damage(game, side, n) {
  const p = game[side];
  p.life -= n;
  if (p.life <= 0) {
    p.life = 0;
    endGame(game, side === 'rival' ? 'you' : 'rival');
  }
  return p.life;
}

function endGame(game, winner) {
  game.phase = 'over';
  game.winner = winner;
  say(game, winner === 'you' ? 'Sable’s flame gutters out. You win!' : 'Your flame gutters out. Sable wins.');
}

// Play a card from a hand onto the table (creature) or resolve it (spell).
// Returns a message for the log, or null when the play is illegal.
export function playCard(game, side, uid) {
  if (game.phase !== 'play' || game.active !== side) return null;
  const p = game[side];
  const foe = game[side === 'you' ? 'rival' : 'you'];
  const i = p.hand.findIndex((c) => c.uid === uid);
  if (i < 0) return null;
  const card = p.hand[i];
  if (card.cost > p.mana) return null;
  if (card.kind === 'creature' && p.board.length >= 6) return 'The table is full — no room for another creature.';
  p.mana -= card.cost;
  p.hand.splice(i, 1);
  if (card.kind === 'creature') {
    const placed = { ...card, hp: card.hp, maxHp: card.hp, canAttack: false };
    p.board.push(placed);
    applyBattlecry(game, side, placed);
    return `${p.name} plays ${card.name}.`;
  }
  // Spells resolve at once.
  switch (card.effect) {
    case 'dmg3': damage(game, side === 'you' ? 'rival' : 'you', 3); return `${p.name} casts ${card.name} — 3 damage!`;
    case 'heal6': heal(game, side, 6); return `${p.name} casts ${card.name} — life restored.`;
    case 'buffall':
      for (const c of p.board) { c.atk += 1; c.hp += 1; c.maxHp += 1; }
      return `${p.name} casts ${card.name} — the ranks stand taller.`;
    case 'dmgall2': {
      for (const c of foe.board.slice()) hurtCreature(game, side === 'you' ? 'rival' : 'you', c, 2);
      return `${p.name} casts ${card.name} — thorns rake the rival ranks.`;
    }
    default: return `${p.name} casts ${card.name}.`;
  }
}

function applyBattlecry(game, side, placed) {
  if (placed.effect === 'heal1') heal(game, side, 1);
  else if (placed.effect === 'heal2') heal(game, side, 2);
  else if (placed.effect === 'draw1') drawCard(game, side);
}

function hurtCreature(game, side, creature, n) {
  creature.hp -= n;
  if (creature.hp <= 0) {
    const p = game[side];
    p.board = p.board.filter((c) => c.uid !== creature.uid);
    say(game, `${creature.name} falls.`);
  }
}

// A creature attacks: a rival creature (both take damage) or the rival directly.
export function attack(game, side, attackerUid, targetUid) {
  if (game.phase !== 'play' || game.active !== side) return null;
  const p = game[side];
  const foe = game[side === 'you' ? 'rival' : 'you'];
  const attacker = p.board.find((c) => c.uid === attackerUid);
  if (!attacker || !attacker.canAttack) return null;
  attacker.canAttack = false;
  if (targetUid === 'hero') {
    damage(game, side === 'you' ? 'rival' : 'you', attacker.atk);
    return `${attacker.name} strikes ${foe.name} for ${attacker.atk}!`;
  }
  const target = foe.board.find((c) => c.uid === targetUid);
  if (!target) return null;
  hurtCreature(game, side === 'you' ? 'rival' : 'you', target, attacker.atk);
  hurtCreature(game, side, attacker, target.atk);
  return `${attacker.name} clashes with ${target.name}!`;
}

export function endTurn(game) {
  if (game.phase !== 'play') return null;
  const next = game.active === 'you' ? 'rival' : 'you';
  game.turn += next === 'you' ? 1 : 0;
  startTurn(game, next);
  return game.active;
}
