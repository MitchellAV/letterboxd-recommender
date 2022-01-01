require("dotenv").config();

export const neo4j = {
  url: process.env.NEO4J_URL as string,
  username: process.env.NEO4J_USERNAME as string,
  password: process.env.NEO4J_PASSWORD as string,
  database: process.env.NEO4J_DATABASE as string,
};
