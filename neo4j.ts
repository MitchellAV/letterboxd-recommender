import neo4j from "neo4j-driver";
import { Query } from "neo4j-driver-core/types/types";
import { neo4j as config } from "./config";

const driver = neo4j.driver(
  config.url,
  neo4j.auth.basic(config.username, config.password)
);
export const read = (
  cypher: Query,
  params = {},
  database = config.database
) => {
  const session = driver.session({
    defaultAccessMode: neo4j.session.READ,
    database,
  });

  return session
    .run(cypher, params)
    .then((res) => {
      session.close();
      return res;
    })
    .catch((e) => {
      session.close();
      throw e;
    });
};
export const write = (
  cypher: Query,
  params = {},
  database = config.database
) => {
  const session = driver.session({
    defaultAccessMode: neo4j.session.WRITE,
    database,
  });

  return session
    .run(cypher, params)
    .then((res) => {
      session.close();
      return res;
    })
    .catch((e) => {
      session.close();
      throw e;
    });
};
