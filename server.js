process.argv.push('--serve-frontend');
await import('./backend/dist/server.js');
