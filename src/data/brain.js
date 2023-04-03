module.exports = {
    PORT: process.env.PORT || 4000,
    origin: [...process.env.NODE_ENV === 'development' ? ['http://localhost:8443', 'http://localhost:3000'] : [process.env.FRONTEND_URL]],
    eventsToHandle: ['SIGTERM', 'SIGINT', 'unhandledRejection', 'uncaughtException']
};