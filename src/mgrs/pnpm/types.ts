export type YamlPair = {
  key: string;
  keySource: string;
  valueSource: string;
  suffix: string;
  indent: string;
};

export type YamlSection = {
  start: number;
  end: number;
  pair: YamlPair;
};

export type YamlEntry = YamlPair & { line: number; end: number };

export type ScanState = {
  escaped: boolean;
  quote?: string;
};

export type FlowSplitState = {
  entries: string[];
  scan: ScanState & { depth: number };
  start: number;
};
