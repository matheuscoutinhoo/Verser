// Smoke test: exercises the full happy path against the running dev server.
// Run with: node scripts/smoke-ai.mjs
// Requires server up on http://localhost:3001 with a valid ABACUS_AI_API_KEY in server/.env.
import { randomBytes } from 'node:crypto';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3001/api';

const log = (label, payload) => {
  const flat = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  console.log(`\n=== ${label} ===\n${flat.length > 1200 ? flat.slice(0, 1200) + '\n…[truncated]' : flat}`);
};

async function call(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => '');
  }
  return { status: res.status, body };
}

const must = (cond, msg) => {
  if (!cond) {
    console.error(`\n✗ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✓ ${msg}`);
};

async function main() {
  const email = `smoke_${randomBytes(4).toString('hex')}@verser.local`;
  const password = 'SmokeTest1!';
  const displayName = 'Smoke Tester';

  // 1. health
  const health = await call('/health');
  must(health.status === 200, `GET /health -> 200 (got ${health.status})`);

  // 2. register
  const reg = await call('/auth/register', {
    method: 'POST',
    body: { email, password, displayName },
  });
  must(reg.status === 201, `POST /auth/register -> 201 (got ${reg.status})`);
  const token = reg.body?.data?.tokens?.accessToken;
  must(typeof token === 'string', 'register returned an access token');

  // 3. create universe
  const universe = await call('/universes', {
    method: 'POST',
    token,
    body: {
      name: 'Smokeworld',
      description: 'A test universe for smoke runs.',
      genre: 'fantasy',
    },
  });
  must(universe.status === 201, `POST /universes -> 201 (got ${universe.status})`);
  const universeId = universe.body.data.id;

  // 4. seed laws + characters + lore so context injection has material
  const law = await call(`/universes/${universeId}/immutable-laws`, {
    method: 'POST',
    token,
    body: {
      title: 'Magic Costs Memory',
      description:
        'Every act of magic erases a proportional amount of the casters memory. No exceptions.',
      category: 'magic',
    },
  });
  must(law.status === 201, 'POST immutable-law -> 201');

  const char = await call(`/universes/${universeId}/characters`, {
    method: 'POST',
    token,
    body: {
      name: 'Aldric the Gray',
      aliases: ['Gray Wolf'],
      personality: 'stoic, careful with words',
      backstory: 'a former soldier who burned his memories of war',
    },
  });
  must(char.status === 201, 'POST character -> 201');

  const lore = await call(`/universes/${universeId}/lore-entries`, {
    method: 'POST',
    token,
    body: {
      title: 'The First War',
      category: 'history',
      content: 'The continent was united after a long war that ended in tragedy.',
      importance: 'critical',
    },
  });
  must(lore.status === 201, 'POST lore-entry -> 201');

  // 5. AI generate-text
  const ai = await call('/ai/generate-text', {
    method: 'POST',
    token,
    body: {
      universeId,
      mode: 'rewrite',
      selection: 'Aldric grimaced and stepped through the doorway.',
      instruction: 'Make it more atmospheric, in third person past tense.',
    },
  });
  log('AI /generate-text response', ai.body);
  must(ai.status === 200, `POST /ai/generate-text -> 200 (got ${ai.status})`);
  must(typeof ai.body?.data?.text === 'string', 'AI returned a text payload');
  console.log(`   provider mocked? ${ai.body.data.mocked}  model=${ai.body.data.model}`);

  // 6. AI consistency check
  const consistency = await call('/ai/analyze-consistency', {
    method: 'POST',
    token,
    body: {
      universeId,
      text: 'Aldric cast a fireball with no cost. He laughed, remembering everything from his childhood as he did.',
    },
  });
  log('AI /analyze-consistency response', consistency.body);
  must(consistency.status === 200, `POST /ai/analyze-consistency -> 200 (got ${consistency.status})`);

  // 7. AI usage summary
  const usage = await call('/ai/usage', { token });
  log('AI /usage response', usage.body);
  must(usage.status === 200, `GET /ai/usage -> 200 (got ${usage.status})`);
  must(usage.body.data.totals.calls >= 2, 'usage shows at least 2 calls logged');

  // 8. universe detail with counts
  const universeDetail = await call(`/universes/${universeId}`, { token });
  must(universeDetail.status === 200, 'GET universe detail -> 200');
  console.log(`   counts: ${JSON.stringify(universeDetail.body.data.counts)}`);

  console.log('\n✅ Smoke test passed.');
}

main().catch((err) => {
  console.error('\n✗ Smoke test crashed:', err);
  process.exit(1);
});
