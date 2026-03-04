export class SseHttpError extends Error {
  status: number;
  constructor(status: number, statusText: string) {
    super(`SSE HTTP ${status}: ${statusText}`);
    this.status = status;
  }
}

type SseHandlers = {
  onOpen?: () => void;
  onEvent?: (evt: { event?: string; id?: string; data: string }) => void;
  onError?: (err: unknown) => void;
  onClose?: () => void;
};

/**
 * Minimal SSE client over fetch() so we can send Authorization headers.
 * Supports: event:, id:, data: lines. Handles multi-line data blocks.
 */
export async function connectSse(url: string, headers: Record<string, string>, handlers: SseHandlers) {
  const controller = new AbortController();

  const run = async () => {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        ...headers,
      },
      signal: controller.signal,
    });

    if (!res.ok) throw new SseHttpError(res.status, res.statusText);
    handlers.onOpen?.();

    const reader = res.body?.getReader();
    if (!reader) throw new Error("SSE body missing (ReadableStream not supported?)");

    const decoder = new TextDecoder("utf-8");

    let buf = "";
    let curEvent: { event?: string; id?: string; dataLines: string[] } = { dataLines: [] };

    const flushEvent = () => {
      if (curEvent.dataLines.length === 0) return;
      handlers.onEvent?.({
        event: curEvent.event,
        id: curEvent.id,
        data: curEvent.dataLines.join("\n"),
      });
      curEvent = { dataLines: [] };
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });

      // Split into lines. SSE uses \n; servers may send \r\n.
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const lineRaw = buf.slice(0, idx);
        buf = buf.slice(idx + 1);

        const line = lineRaw.endsWith("\r") ? lineRaw.slice(0, -1) : lineRaw;

        // blank line = dispatch current event
        if (line === "") {
          flushEvent();
          continue;
        }

        // comments / keepalive
        if (line.startsWith(":")) continue;

        const colon = line.indexOf(":");
        const field = colon === -1 ? line : line.slice(0, colon);
        // spec: if ":" present, value may start with one leading space
        const valueStr = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");

        if (field === "event") curEvent.event = valueStr;
        else if (field === "id") curEvent.id = valueStr;
        else if (field === "data") curEvent.dataLines.push(valueStr);
        // ignore retry: for now
      }
    }

    handlers.onClose?.();
  };

  run().catch((e) => {
    if (controller.signal.aborted) return;
    handlers.onError?.(e);
  });

  return {
    close: () => controller.abort(),
  };
}