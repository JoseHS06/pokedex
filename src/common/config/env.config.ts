export const EnvConfiguration = () => ({
    enviroment: process.env.NODE_ENV || 'dev',
    port: process.env.PORT || 3000,
    mongodb: process.env.MONGODB,
    defaultLimit: process.env.DEFAULT_LIMIT || 10,
});