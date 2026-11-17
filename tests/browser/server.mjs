import { createServer, preview } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const root = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const apps = {
  demo: resolve(root, "apps/demo"),
  docs: resolve(root, "apps/docs"),
  react: resolve(root, "apps/react-example")
};
const options = { host: "127.0.0.1", strictPort: true };
console.log("Starting in-process Vite test servers...");
const devServers = await Promise.all([
  createServer({ root: apps.demo, configFile: resolve(apps.demo, "vite.config.ts"), server: { ...options, port: 43213 } }),
  createServer({ root: apps.docs, configFile: resolve(apps.docs, "vite.config.ts"), server: { ...options, port: 43214 } }),
  createServer({ root: apps.react, server: { ...options, port: 43216 } })
]);
console.log("Vite dev servers created.");
await Promise.all(devServers.map(server => server.listen()));
console.log("Vite dev servers listening.");
const previewServers = await Promise.all([
  preview({ root: apps.demo, configFile: resolve(apps.demo, "vite.config.ts"), preview: { ...options, port: 43215 } }),
  preview({ root: apps.docs, configFile: resolve(apps.docs, "vite.config.ts"), preview: { ...options, port: 43217 } })
]);
console.log("Vite preview servers created.");
let stopping = false;

async function shutdown() {
  if (stopping) return;
  stopping = true;
  const servers = [...devServers, ...previewServers].map(server => server.httpServer);
  await Promise.race([
    Promise.all(servers.map(server => new Promise(resolveClose => {
      if (!server.listening) resolveClose();
      else server.close(() => resolveClose());
    }))),
    new Promise(resolveTimeout => setTimeout(resolveTimeout, 1_500))
  ]);
  process.exit(0);
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

function isListening(port) {
  return new Promise(resolveListening => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.once("connect", () => { socket.destroy(); resolveListening(true); });
    socket.once("error", () => resolveListening(false));
  });
}

const ports = [43213, 43214, 43215, 43216, 43217];
const startedAt = Date.now();
while (Date.now() - startedAt < 120_000) {
  if ((await Promise.all(ports.map(isListening))).every(Boolean)) {
    console.log("Browser test servers ready on ports 43213-43217.");
    await new Promise(() => {});
  }
  await new Promise(resolveDelay => setTimeout(resolveDelay, 250));
}
await shutdown();
