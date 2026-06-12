import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import prisma from './config/database';

const PORT = env.PORT;

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 E-Supervisi SMK API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   API Base:    http://localhost:${PORT}/api`);
      console.log(`   Health:      http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Database disconnected. Bye!');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
