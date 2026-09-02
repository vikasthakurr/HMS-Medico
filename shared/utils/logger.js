import winston from 'winston';

const createLogger = (serviceName) => {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
  });
};

export default createLogger;
