## File Upload (POC)

This adds a minimal, in-memory file upload capability wired to the chat composer and a Next.js API route.

### What was added

- **UI (`src/components/Composer.tsx`)**:
  - `onUploadFile` prop: `(file: { id: string; file: File }) => Promise<unknown>`
  - Hidden native file input + **Attach** button (design system) with paperclip icon
  - Upload state chips with statuses: **Uploading** → **Uploaded**
  - Cross button on each chip to remove files before sending
  - Send button disabled while any file is uploading
  - On submit, uploaded files are included in the message `context` and local upload state is cleared
- **API**:
  - `POST /api/files` (`src/app/api/files/route.ts`) accepts `multipart/form-data` with one or more `file` fields and optional `id`
  - Files are stored in-memory as text (using `File.text()`)
  - In-memory store: `src/app/api/files/fileStore.ts` with `addFile`, `removeFile`, `getFile`, `listFiles`
  - `POST /api/chat` (`src/app/api/chat/route.ts`) includes `read_file` tool in the system prompt

### Client usage (example)

Pass an upload function into `CustomComposer`:

```tsx
async function onUploadFile({ id, file }: { id: string; file: File }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("id", id);

  const res = await fetch("/api/files", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}
```

Then render the composer somewhere in your page:

```tsx
<CustomComposer onUploadFile={onUploadFile} />
```

### API details

- **Endpoint**: `POST /api/files`
- **Body**: `multipart/form-data`
  - `file`: one or more file parts
  - `id` (optional): client-generated ID to correlate UI with server state
- **Response**: `{ files: Array<{ id, name, type, size }> }`
- **Storage**: in-memory, text-only; not persisted, cleared on server restart

### Caveats

- In-memory store is not suitable for production (no persistence, no limits)
- Consider size limits, validation, and auth for real-world use
