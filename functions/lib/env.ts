export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  AUTH_SECRET: string;
}

export interface RequestData {
  // Memory ids the caller has unlocked (from the signed mem_access cookie). Never blocks.
  unlockedMemories: number[];
}

export type CFContext = EventContext<Env, string, RequestData>;
