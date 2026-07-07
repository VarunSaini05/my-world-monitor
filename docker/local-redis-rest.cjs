#!/usr/bin/env node
/**
 * Tiny Upstash-compatible REST cache for single-container self-hosting.
 *
 * This is intentionally small: it supports the Redis commands used by the
 * Docker local API, health endpoint, and lightweight seed scripts. It is not a
 * general Redis replacement, but it lets a Render free web service run the
 * dashboard honestly without requiring a separate paid Redis service.
 */

const http = require('http');
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { dirname } = require('path');

const PORT = Number(process.env.LOCAL_REDIS_PORT || 46279);
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'local-self-hosted';
const STORE_PATH = process.env.LOCAL_REDIS_STORE_PATH || '/tmp/worldmonitor-local-redis.json';

/** @type {Map<string, { value: string | string[], expiresAt: number | null }>} */
const store = new Map();
let saveTimer = null;

function now() {
  return Date.now();
}

function load() {
  try {
    if (!existsSync(STORE_PATH)) return;
    const parsed = JSON.parse(readFileSync(STORE_PATH, 'utf8'));
    const at = now();
    for (const [key, entry] of Object.entries(parsed?.entries || {})) {
      if (entry?.expiresAt && entry.expiresAt <= at) continue;
      store.set(key, { value: entry.value, expiresAt: entry.expiresAt ?? null });
    }
    console.log(`[local-redis] loaded ${store.size} keys from ${STORE_PATH}`);
  } catch (err) {
    console.warn('[local-redis] store load failed:', err?.message || err);
  }
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      mkdirSync(dirname(STORE_PATH), { recursive: true });
      const entries = {};
      for (const [key, entry] of store.entries()) entries[key] = entry;
      writeFileSync(STORE_PATH, JSON.stringify({ savedAt: new Date().toISOString(), entries }));
    } catch (err) {
      console.warn('[local-redis] store save failed:', err?.message || err);
    }
  }, 250);
  saveTimer.unref?.();
}

function cleanupKey(key) {
  const entry = store.get(key);
  if (entry?.expiresAt && entry.expiresAt <= now()) {
    store.delete(key);
    return null;
  }
  return entry || null;
}

function getString(key) {
  const entry = cleanupKey(key);
  if (!entry || Array.isArray(entry.value)) return null;
  return entry.value;
}

function ttlFromArgs(args, startIdx) {
  let expiresAt = null;
  for (let i = startIdx; i < args.length - 1; i += 1) {
    const flag = String(args[i]).toUpperCase();
    const n = Number(args[i + 1]);
    if (flag === 'EX' && Number.isFinite(n)) expiresAt = now() + n * 1000;
    if (flag === 'PX' && Number.isFinite(n)) expiresAt = now() + n;
  }
  return expiresAt;
}

function execute(command) {
  if (!Array.isArray(command) || command.length === 0) return { error: 'invalid command' };
  const op = String(command[0]).toUpperCase();
  const key = command[1] == null ? '' : String(command[1]);

  try {
    if (op === 'GET') return { result: getString(key) };
    if (op === 'STRLEN') {
      const value = getString(key);
      return { result: value ? Buffer.byteLength(value, 'utf8') : 0 };
    }
    if (op === 'SET') {
      const nx = command.map((x) => String(x).toUpperCase()).includes('NX');
      if (nx && cleanupKey(key)) return { result: null };
      store.set(key, { value: String(command[2] ?? ''), expiresAt: ttlFromArgs(command, 3) });
      scheduleSave();
      return { result: 'OK' };
    }
    if (op === 'DEL') {
      let count = 0;
      for (const k of command.slice(1).map(String)) {
        if (store.delete(k)) count += 1;
      }
      if (count) scheduleSave();
      return { result: count };
    }
    if (op === 'EXPIRE') {
      const entry = cleanupKey(key);
      if (!entry) return { result: 0 };
      entry.expiresAt = now() + Number(command[2] || 0) * 1000;
      scheduleSave();
      return { result: 1 };
    }
    if (op === 'LPUSH') {
      const entry = cleanupKey(key);
      const list = entry && Array.isArray(entry.value) ? entry.value : [];
      list.unshift(...command.slice(2).map(String));
      store.set(key, { value: list, expiresAt: entry?.expiresAt ?? null });
      scheduleSave();
      return { result: list.length };
    }
    if (op === 'LRANGE') {
      const entry = cleanupKey(key);
      const list = entry && Array.isArray(entry.value) ? entry.value : [];
      let start = Number(command[2] || 0);
      let stop = Number(command[3] || 0);
      if (start < 0) start = list.length + start;
      if (stop < 0) stop = list.length + stop;
      return { result: list.slice(Math.max(0, start), stop + 1) };
    }
    if (op === 'LTRIM') {
      const entry = cleanupKey(key);
      if (!entry || !Array.isArray(entry.value)) return { result: 'OK' };
      let start = Number(command[2] || 0);
      let stop = Number(command[3] || 0);
      if (start < 0) start = entry.value.length + start;
      if (stop < 0) stop = entry.value.length + stop;
      entry.value = entry.value.slice(Math.max(0, start), stop + 1);
      scheduleSave();
      return { result: 'OK' };
    }
    if (op === 'EVAL') {
      // Used by seed lock release: compare key value with ARGV[1], then DEL.
      const numKeys = Number(command[2] || 0);
      const keys = command.slice(3, 3 + numKeys).map(String);
      const args = command.slice(3 + numKeys).map(String);
      const current = getString(keys[0]);
      if (current != null && current === args[0]) {
        store.delete(keys[0]);
        scheduleSave();
        return { result: 1 };
      }
      return { result: 0 };
    }
    return { error: `unsupported command ${op}` };
  } catch (err) {
    return { error: err?.message || String(err) };
  }
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function authorized(req) {
  const header = req.headers.authorization || '';
  return header === `Bearer ${TOKEN}`;
}

load();

const server = http.createServer(async (req, res) => {
  if (!authorized(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unauthorized' }));
    return;
  }

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname.startsWith('/get/')) {
      const key = decodeURIComponent(url.pathname.slice('/get/'.length));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: getString(key) }));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/pipeline') {
      const body = await readJson(req);
      const results = Array.isArray(body) ? body.map(execute) : [{ error: 'invalid pipeline' }];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/') {
      const body = await readJson(req);
      const result = execute(body);
      res.writeHead(result.error ? 400 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err?.message || String(err) }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[local-redis] listening on http://127.0.0.1:${PORT}`);
});
