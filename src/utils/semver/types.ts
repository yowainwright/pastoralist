export type Operator = "=" | ">" | ">=" | "<" | "<=";
export type Comparator = { operator: Operator; version: string };
export type RangeVersion = { parts: number[]; version: string };
