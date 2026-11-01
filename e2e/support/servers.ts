import { tmpdir } from "node:os";
import { join } from "node:path";

export const STORE_PORT = 3100;
export const REAL_STORE_PORT = 3101;
export const SWITCHED_PORT = 3102;

export const REAL_STORE = `http://localhost:${REAL_STORE_PORT}`;
export const SWITCHED_STORE = `http://localhost:${SWITCHED_PORT}`;

/** What support/db-switch.cjs reads. */
export const DB_SWITCH_FILE = join(tmpdir(), "matexpress-e2e-db-switch.json");
