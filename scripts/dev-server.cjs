#!/usr/bin/env node
/* eslint-env node */
/* globals console */

const http = require('http');
const path = require('path');
const fs = require('fs');
const process = require('node:process');
const { URL } = require('url');

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || '127.0.0.1';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const candidates = buildCandidates(requestUrl.pathname);

  serveFromCandidates(candidates, res);
});

server.listen(port, host, () => {
  console.log(`DOGULE1_DEV_SERVER listening on http://${host}:${port}`);
  console.log(`Serving /apps/web as the default entry with repo root fallback (${rootDir})`);
});

function buildCandidates(pathname) {
  if (pathname === '/' || pathname === '') {
    return [path.join(webDir, 'index.html')];
  }

  const sanitized = sanitizePath(pathname);
  if (!sanitized && sanitized !== '') {
    return [];
  }

  return [
    path.join(rootDir, sanitized),
    path.join(webDir, sanitized),
  ];
}

function sanitizePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded);
  const trimmed = normalized.replace(/^([/\\])+/, '');

  if (!trimmed) {
    return trimmed;
  }

  const segments = trimmed.split(/[/\\]+/).filter(Boolean);
  const isUnsafe = segments.some((segment) => segment === '..');
  if (isUnsafe) {
    return null;
  }

  return segments.join(path.sep);
}

function serveFromCandidates(candidates, res) {
  if (candidates.length === 0) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const candidate = candidates.shift();
  if (!candidate || !candidate.startsWith(rootDir)) {
    serveFromCandidates(candidates, res);
    return;
  }

  fs.promises
    .stat(candidate)
    .then((stat) => {
      if (stat.isDirectory()) {
        candidates.unshift(path.join(candidate, 'index.html'));
        serveFromCandidates(candidates, res);
        return;
      }

      streamFile(candidate, res);
    })
    .catch(() => serveFromCandidates(candidates, res));
}

function streamFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}
