# Build Stage
FROM node:14 AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

# Copy all the source code into working dir
COPY . .

RUN npm run build

# Production Stage
FROM nginx:stable-alpine

# Copy the build artifact into nginx which serves frontend project's static files.
COPY --from=build /app/build /usr/share/nginx/html

# Listen on port:80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]