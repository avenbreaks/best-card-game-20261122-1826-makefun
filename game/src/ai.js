// Ember Pact — Sable's mind. A readable opponent: it plays what it can afford,
// biggest first, saves its burst for a killing blow, then sends every rested
// creature at the weakest thing it can kill — or straight at you.
import { playCard, attack, endTurn } from './state.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// One full AI turn, with small pauses so the player can follow it.
export async function takeAiTurn(game, onStep) {
  const ai = game.rival;
  // 1) Spells first when they win the game or save it.
  for (const card of ai.hand.slice()) {
    if (game.phase !== 'play') return;
    if (card.kind === 'spell' && card.effect === 'dmg3' && game.you.life <= 3 && card.cost <= ai.mana) {
      const msg = playCard(game, 'rival', card.uid);
      if (msg) { onStep(msg); await sleep(650); }
    }
    if (card.kind === 'spell' && card.effect === 'heal6' && ai.life <= 12 && card.cost <= ai.mana) {
      const msg = playCard(game, 'rival', card.uid);
      if (msg) { onStep(msg); await sleep(650); }
    }
  }
  // 2) Creatures, dearest first, while the table has room.
  const creatures = ai.hand.filter((c) => c.kind === 'creature').sort((a, b) => b.cost - a.cost);
  for (const card of creatures) {
    if (game.phase !== 'play') return;
    if (ai.board.length >= 6) break;
    if (card.cost <= ai.mana) {
      const msg = playCard(game, 'rival', card.uid);
      if (msg) { onStep(msg); await sleep(650); }
    }
  }
  // 3) Remaining spells when they clearly help.
  for (const card of ai.hand.slice()) {
    if (game.phase !== 'play') return;
    if (card.kind !== 'spell' || card.cost > ai.mana) continue;
    if (card.effect === 'buffall' && ai.board.length > 0) {
      const msg = playCard(game, 'rival', card.uid);
      if (msg) { onStep(msg); await sleep(650); }
    } else if (card.effect === 'dmgall2' && game.you.board.length >= 2) {
      const msg = playCard(game, 'rival', card.uid);
      if (msg) { onStep(msg); await sleep(650); }
    } else if (card.effect === 'dmg3' && ai.mana >= card.cost + 2) {
      const msg = playCard(game, 'rival', card.uid);
      if (msg) { onStep(msg); await sleep(650); }
    }
  }
  // 4) Attack with everything that can: kill the weakest creature it can kill,
  // otherwise go for the player's life.
  for (const c of ai.board.slice()) {
    if (game.phase !== 'play') return;
    if (!c.canAttack) continue;
    const prey = game.you.board.filter((t) => t.hp <= c.atk).sort((a, b) => a.hp - b.hp)[0];
    const msg = attack(game, 'rival', c.uid, prey ? prey.uid : 'hero');
    if (msg) { onStep(msg); await sleep(650); }
  }
  await sleep(400);
  endTurn(game);
  onStep(null);
}
