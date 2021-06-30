FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN cd public && mkdir thumbnails

ENV PORT=5000

ENV RECOMMENDATION_URI="https://api.letterboxd-recommendation.com/recommend/movie/"

EXPOSE 5000

CMD [ "npm", "start" ]