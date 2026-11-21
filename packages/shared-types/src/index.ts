/**
 * Firestore document shapes (PLAN section 10). Timestamps are typed loosely as `TimestampLike`
 * so the same types work with the web SDK, React Native Firebase and the Admin SDK.
 */
export interface TimestampLike {
  toDate(): Date;
  toMillis(): number;
}

export type Role = "user" | "support" | "admin";
export type LanguageCode = "en" | "ms" | "zh" | "ta";
export type ChatMode = "chat" | "write" | "learn" | "work";
export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "streaming" | "complete" | "stopped" | "error";

export const LANGUAGES: Record<LanguageCode, string> = {
  en: "English",
  ms: "Bahasa Melayu",
  zh: "中文",
  ta: "தமிழ்",
};

/** users/{uid} */
export interface UserProfile {
  displayName: string;
  photoURL: string | null;
  language: LanguageCode;
  preferredModelId: string | null;
  memoryEnabled: boolean;
  planId: string;
  role: Role;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

/** users/{uid}/conversations/{cid} */
export interface Conversation {
  title: string;
  modelId: string;
  mode: ChatMode;
  messageCount: number;
  /** Short preview so the list never has to read messages (PLAN section 18). */
  preview: string;
  lastMessageAt: TimestampLike;
  archived: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

/** users/{uid}/conversations/{cid}/messages/{mid} */
export interface Message {
  role: MessageRole;
  content: string;
  attachmentIds: string[];
  modelId: string | null;
  tokensIn: number;
  tokensOut: number;
  status: MessageStatus;
  parentId: string | null;
  rating: -1 | 0 | 1;
  createdAt: TimestampLike;
}

/** plans/{planId} */
export interface Plan {
  name: string;
  dailyLimits: {
    chats: number;
    drafts: number;
    images: number;
    lessons: number;
    workRuns: number;
  };
  allowedModels: string[];
  searchCap: number;
  priceMyr: number | null;
}

/** usage_records/{uid_yyyymmdd} */
export interface UsageRecord {
  uid: string;
  chats: number;
  drafts: number;
  lessons: number;
  workRuns: number;
  searches: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

/** system_settings/public */
export interface PublicSettings {
  maintenanceMode: boolean;
  minAppVersion: string;
}

export type WithId<T> = T & { id: string };
