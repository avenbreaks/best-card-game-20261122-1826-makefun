// Ember Pact — screenshot presets. `?shot=start|table|win|loss&seed=N` opens the
// game straight into a real, playable state, so the screenshots are honest
// renders of the game's own code: the title, a mid-duel table, the win screen,
// and the loss screen. The seeded RNG makes the table shot reproducible.
import { createGame, playCard, attack, endTurn, say } from './state.js';
import { CARD_BY_ID } from './cards.js';

// Put a chosen card into a hand, playing it straight from a fresh deck when
// the hand does not hold it (a real play through the rules, not a set-piece).
function forcePlay(game, side, id) {
  const p = game[side];
  let card = p.hand.find((c) => c.id === id);
  if (!card) {
    card = { uid: 9000 + Math.floor(game.rng() * 899), ...CARD_BY_ID[id] };
    p.hand.push(card);
  }
  p.mana = 10;
  game.active = side; // playCard only allows the active side's plays
  const msg = playCard(game, side, card.uid);
  game.active = 'you';
  if (msg) say(game, msg);
  return card;
}

export function presetGame(shot, seed) {
  const game = createGame(seed);
  game.phase = 'play';
  if (shot === 'start') {
    game.phase = 'title';
    return game;
  }
  if (shot === 'table') {
    // A mid-duel table: turn 4, both sides have creatures out, hands are full.
    game.turn = 4;
    forcePlay(game, 'you', 'golem');
    forcePlay(game, 'you', 'sprite');
    forcePlay(game, 'rival', 'sprout');
    forcePlay(game, 'rival', 'serpent');
    // Wake the creatures so the shot shows them ready to fight.
    for (const c of [...game.you.board, ...game.rival.board]) c.canAttack = true;
    // Embers after the plays above (forcePlay tops mana up to pay costs).
    game.you.maxMana = 4; game.you.mana = 2;
    game.rival.maxMana = 4; game.rival.mana = 1;
    say(game, 'Turn 4 — the table is crowded and the embers are high.');
    return game;
  }
  if (shot === 'win') {
    game.turn = 7;
    game.rival.life = 0;
    game.phase = 'over';
    game.winner = 'you';
    game.you.life = 14;
    say(game, 'Sable’s flame gutters out. You win!');
    return game;
  }
  if (shot === 'loss') {
    game.turn = 6;
    game.you.life = 0;
    game.phase = 'over';
    game.winner = 'rival';
    game.rival.life = 9;
    say(game, 'Your flame gutters out. Sable wins.');
    return game;
  }
  return game;
}

// A tiny scripted duel for the table shot's log line (unused by the presets,
// kept for play-testing from the console: window.__ember.demo()).
export function demoDuel(seed) {
  const game = createGame(seed);
  game.phase = 'play';
  forcePlay(game, 'you', 'imp');
  endTurn(game);
  forcePlay(game, 'rival', 'sprout');
  endTurn(game);
  return game;
}
