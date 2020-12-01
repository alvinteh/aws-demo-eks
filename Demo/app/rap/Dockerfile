FROM node:14-alpine 

# Set environment variables
ENV APP_HOST=0.0.0.0 APP_PORT=3000
EXPOSE 3000

# Run as non-root user
USER node

# Setup app directory
RUN mkdir /home/node/app/ && chown -R node:node /home/node/app

WORKDIR /home/node/app

# Copy app source and install dependencies
COPY --chown=node:node . .

RUN npm install

# Set start script
CMD [ "npm", "start"]