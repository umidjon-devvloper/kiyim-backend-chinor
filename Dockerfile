FROM node:20-alpine

WORKDIR /app

# Package files copy
COPY package*.json ./

# Dependencies install
RUN npm install --omit=dev

# Source copy
COPY . .

# Port expose
EXPOSE 5000

# Start
CMD ["node", "src/server.js"]
