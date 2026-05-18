import type { Output } from "../types";
import { playShimmer } from "../shimmer";
import { SHIMMER_DEFAULT_FRAME_INTERVAL_MS } from "../constants";
import type { Completer } from "./types";

export const createShimmerCompleter =
  (out: Output): Completer =>
  (text, prefix, suffix) => {
    playShimmer(text, SHIMMER_DEFAULT_FRAME_INTERVAL_MS, out, prefix, suffix);
  };
