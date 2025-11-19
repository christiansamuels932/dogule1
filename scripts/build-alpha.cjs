#!/usr/bin/env node
/* eslint-env node */

/**
 * Minimal static build script for Dogule1 Alpha.
 * Copies the hash-router entrypoint plus shared modules into /dist
 * so the bundle can be hosted on a bare NAS web share without Vite.
 */

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const appDir = path.join(rootDir, "apps", "web");
const modulesDir = path.join(rootDir, "modules");

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
}

function copyModules() {
  const dest = path.join(distDir, "modules");
  fs.cpSync(modulesDir, dest, { recursive: true });
}

function writeIndexHtml() {
  const sourceIndex = path.join(appDir, "index.html");
  const raw = fs.readFileSync(sourceIndex, "utf8");
  const patched = raw
    .replace(/\.\/main\.js/g, "./assets/main.js")
    .replace(/\.\.\/\.\.\/modules/g, "./modules");

  fs.writeFileSync(path.join(distDir, "index.html"), patched, "utf8");
}

function writeMainJs() {
  const sourceMain = path.join(appDir, "main.js");
  const raw = fs.readFileSync(sourceMain, "utf8");
  const patched = raw
    .replace(/\.\.\/\.\.\/modules/g, "./modules")
    .replace(/import\(`\/modules\//g, "import(`./modules/");

  const assetsDir = path.join(distDir, "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.writeFileSync(path.join(assetsDir, "main.js"), patched, "utf8");
}

function run() {
  cleanDist();
  copyModules();
  writeIndexHtml();
  writeMainJs();
  console.log("DOGULE1_BUILD: dist ready at", distDir);
}

run();
