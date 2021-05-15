FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN cd public && mkdir thumbnails

ENV PORT=5000

ENV RECOMMENDATION_URI="https://api.letterboxd-recommendation.com/recommend/movie/"

ENV MONGODB_URI="mongodb+srv://admin:xNKZCLA3befWpPli@mitchellscluster.mslso.mongodb.net/letterboxdDatabase?retryWrites=true&w=majority"

EXPOSE 5000

CMD [ "npm", "start" ]