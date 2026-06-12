---
'@graphorin/client': patch
'@graphorin/server': patch
---

fix(client): the SSE fallback delivers events and reconnects resume in place (IP-3 / IP-7)

Three independent breaks made the SSE fallback unable to deliver a single
event, and reconnects silently ended consumers:

- **IP-3a** — `#sseUrl()` sent the literal `/v1/sessions/:sessionId/events`
  template (no substitution code existed). The client gains a `sessionId`
  option bound into the path; connecting over SSE without it fails with an
  actionable error.
- **IP-3b** — the transport listened only for unnamed `message` events while
  the server writes **named** events (`event: <frame.type>`) — `EventSource`
  never delivers those to a `message` listener. The transport is rewritten on
  **fetch streaming** with a direct SSE parser that ignores event names (every
  frame's full JSON rides in `data:`) — which also sends the `Authorization`
  header natively, removing the polyfill seam.
- **IP-3c** — frames routed through `#subscriptions`, which is empty on SSE.
  The SSE connection is now one implicit subscription to the bound session:
  `subscribe()` returns it for the bound subject (and keeps rejecting others),
  and unmatched frames fall through to it.
- **IP-7** — reconnect created a NEW subscription object and closed the old
  one: the consumer's `for await` ended `{done: true}` while events piled up
  unread in an orphan, and the resubscribe read the fresh transport's
  `lastEventId` (always `undefined`) so the server replay buffer was never
  consulted. Resubscribes now send the **subscription's own cursor**
  (`sinceEventId`) and **rebind the same object** to the new server
  subscription id — the in-flight iterator survives and replayed events arrive
  in it.

Wire-format parity tests replace the fake-`EventSource` suite (byte-identical
to the server's `encodeSse`), and the reconnect test pins cursor + same-object
survival end-to-end.
