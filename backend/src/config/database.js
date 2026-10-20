const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('warn', (e) => logger.warn(`Prisma warning: ${e.message || JSON.stringify(e)}`));
prisma.$on('error', (e) => logger.error(`Prisma error: ${e.message || JSON.stringify(e)}`));

async function connectDatabase() {
  await prisma.$connect();
  logger.info('PostgreSQL connected via Prisma');
}

async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
