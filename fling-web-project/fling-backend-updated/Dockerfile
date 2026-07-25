FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# serviceAccountKey.json and driveServiceAccount.json must be provided at
# deploy time (as mounted secrets or env-injected files) — don't bake them
# into the image or commit them to git.

EXPOSE 4000
CMD ["node", "server.js"]
