import { defineConfig } from "vite";

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY"
};

export default defineConfig({
  preview: { headers: securityHeaders },
  plugins: [{
    name: "mock-streaming-orders",
    configureServer(server) {
      server.middlewares.use("/mock/orders.ndjson", (request, response, next) => {
        if (request.method !== "GET") { next(); return; }
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        let index = 0;
        const batch = (): void => {
          if (response.destroyed) return;
          const end = Math.min(index + 250, 50_000);
          for (; index < end; index++) {
            const order = {
              id: `ORD-${String(index + 1).padStart(5, "0")}`,
              customer: `Customer ${index % 173 + 1}`,
              item: ["Studio stay", "Garden suite", "City pass", "Weekend package"][index % 4],
              status: ["Confirmed", "Pending", "Completed", "Cancelled"][index % 4],
              total: ((index * 37) % 120_000) / 100,
              date: new Date(Date.UTC(2026, 0, 1 + index % 300)).toISOString().slice(0, 10)
            };
            response.write(`${JSON.stringify(order)}\n`);
          }
          if (index >= 50_000) response.end();
          else setTimeout(batch, 12);
        };
        batch();
      });
      server.middlewares.use("/mock/slow-orders.ndjson", (request, response, next) => {
        if (request.method !== "GET") { next(); return; }
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        let index = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        response.on("close", () => { if (timer) clearTimeout(timer); });
        const batch = (): void => {
          if (response.destroyed) return;
          const end = Math.min(index + 100, 50_000);
          for (; index < end; index++) {
            response.write(`${JSON.stringify({ id: `SLOW-${index + 1}`, customer: `Guest ${index + 1}`, item: "Test", status: "Pending", total: index, date: "2026-01-01" })}\n`);
          }
          if (index >= 50_000) response.end();
          else timer = setTimeout(batch, 200);
        };
        batch();
      });
    }
  }]
});
