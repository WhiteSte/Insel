# my-dicom-app/backend/Dockerfile
FROM node:16-alpine
WORKDIR /usr/src/app

COPY package.json ./
# 1) Install production + dev dependencies
RUN npm install

# 2) Install nodemon globally
RUN npm install -g nodemon

COPY . .
EXPOSE 4000

# 3) Now nodemon is available in PATH
CMD ["nodemon", "app.js"]