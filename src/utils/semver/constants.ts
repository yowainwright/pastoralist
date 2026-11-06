import type { Operator } from "./types";

export const VERSION =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/;
export const PARTIAL = /^v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?$/;
export const TOKEN = /^(\^|~|>=|<=|>|<|=)?(.+)$/;
export const PARTIAL_OPERATORS: Record<Operator, Operator> = {
  "=": "=",
  ">": ">=",
  ">=": ">=",
  "<": "<",
  "<=": "<",
};
export const OPERATORS: Record<Operator, (order: number) => boolean> = {
  "=": (order) => order === 0,
  ">": (order) => order > 0,
  ">=": (order) => order >= 0,
  "<": (order) => order < 0,
  "<=": (order) => order <= 0,
};
