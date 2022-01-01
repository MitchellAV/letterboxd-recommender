import {
  isDuration,
  isLocalTime,
  isTime,
  isDate,
  isDateTime,
  isLocalDateTime,
  isInt,
  isPoint,
} from "neo4j-driver";
import { isNode, isRelationship, QueryResult } from "neo4j-driver-core";
import express, { NextFunction, Request, Response } from "express";

const isQueryResult = (x: any): x is QueryResult => {
  return (x as QueryResult).records !== undefined;
};

const toNative = (
  value: any,
  // | null
  // | undefined
  // | QueryResult
  // | Node
  // | Relationship
  // | Integer
  // | Point
  // | string[],
  showLabelsOrType = false,
  showIdentity = false
): any => {
  if (value === null) return null;
  else if (value === undefined) return null;
  else if (isQueryResult(value)) {
    return value.records.map((row) =>
      Object.fromEntries(row.keys.map((key) => [key, toNative(row.get(key))]))
    );
  } else if (Array.isArray(value)) return value.map((value) => toNative(value));
  else if (isNode(value))
    return toNative({
      _id: showIdentity ? toNative(value.identity) : undefined,
      _labels: showLabelsOrType ? toNative(value.labels) : undefined,
      ...toNative(value.properties),
    });
  else if (isRelationship(value))
    return toNative({
      _id: showIdentity ? toNative(value.identity) : undefined,
      _type: showLabelsOrType ? toNative(value.type) : undefined,
      ...toNative(value.properties),
    });
  // Number
  else if (isInt(value)) return value.toNumber();
  // Temporal
  else if (
    isDuration(value) ||
    isLocalTime(value) ||
    isTime(value) ||
    isDate(value) ||
    isDateTime(value) ||
    isLocalDateTime(value)
  ) {
    return value.toString();
  }

  // Spatial
  if (isPoint(value)) {
    switch (value.srid.toNumber()) {
      case 4326:
        return { longitude: value.y, latitude: value.x };

      case 4979:
        return { longitude: value.y, latitude: value.x, height: value.z };

      default:
        return toNative({ x: value.x, y: value.y, z: value.z });
    }
  }

  // Object
  else if (typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).map((key) => [
        key,
        toNative(value[key], showLabelsOrType, showIdentity),
      ])
    );
  }

  return value;
};

export default (req: Request, res: Response, next: NextFunction) => {
  const json = res.json;
  res.json = (value) => {
    json.call(this, toNative(value));
  };

  next();
};
