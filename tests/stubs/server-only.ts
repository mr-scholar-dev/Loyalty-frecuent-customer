// The real `server-only` package throws when the client build is resolved,
// which is what happens under jsdom. Server modules are still exercised in
// Node here, so aliasing it away is safe and keeps the guard in place for the
// actual Next.js builds.
export {};
