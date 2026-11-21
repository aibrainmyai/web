"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/**
 * Message box. Sending is disabled until the chatStream Cloud Function exists (phase 5):
 * no reply engine is faked here (decision 10, "no mock data in production").
 */
export function Composer() {
  const [text, setText] = useState("");
  const ready = false;

  return (
    <div className="border-t border-border bg-bg/80 p-4 backdrop-blur">
      <form
        className="mx-auto flex max-w-3xl items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <label htmlFor="composer" className="sr-only">Message MYai</label>
        <textarea
          id="composer"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message MYai…"
          className="max-h-48 min-h-11 flex-1 resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <Button type="submit" disabled={!ready || !text.trim()} title={ready ? "Send" : "Chat engine not connected yet"}>
          Send
        </Button>
      </form>
      {!ready && (
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-text-muted">
          The chat engine connects in the next build phase. Your history and settings already work.
        </p>
      )}
    </div>
  );
}
