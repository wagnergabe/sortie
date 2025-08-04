// public/sw.js

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installed");
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
});

self.addEventListener("fetch", (event) => {
  // Optional: cache-first or network-first strategy could go here
});
