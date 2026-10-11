import { buildApp } from './app.js';
import { env } from './config/env.js';

async function start() {
  try {
    const app = await buildApp();
    const address = await app.listen({
      port: env.PORT,
      host: '0.0.0.0'
    });

    app.log.info(`🚀 CampusFace API server running at ${address}`);
  } catch (err) {
    console.error('❌ Failed to start CampusFace API:', err);
    process.exit(1);
  }
}

start();
