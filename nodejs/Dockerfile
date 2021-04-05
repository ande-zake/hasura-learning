FROM node:14.15.4-stretch-slim
WORKDIR /code
# Bundle app source : To bundle your app's source code inside the Docker image, use the COPY instruction
COPY . .
WORKDIR /code
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production