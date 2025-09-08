import {
  CreateMessage,
  useThreadActions,
  useThreadState,
} from "@crayonai/react-core";
import { Button } from "@crayonai/react-ui";
import { CircleX, SendIcon, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

export const CustomComposer = ({
  onUploadFile,
}: {
  onUploadFile: (file: { id: string; file: File }) => Promise<unknown>;
}) => {
  const [message, setMessage] = useState("");
  const [uploads, setUploads] = useState<
    Array<{ id: string; name: string; status: "uploading" | "uploaded" }>
  >([]);
  const { isRunning } = useThreadState();
  const { onCancel, processMessage } = useThreadActions();
  const isUploading = uploads.some((u) => u.status === "uploading");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleRemoveUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleMessageButton = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUploading) {
      return;
    }
    if (isRunning) {
      onCancel();
      return;
    }

    if (!message) return;

    const createMessage: CreateMessage = {
      role: "user",
      type: "prompt",
      message,
    };

    if (uploads.length > 0) {
      createMessage.context = [
        "user uploaded these files:",
        Object.fromEntries(uploads.map((u) => [u.id, { name: u.name }])),
      ];
    }

    processMessage(createMessage);
    setUploads([]);
    setMessage("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();

      setUploads((prev) => [
        ...prev,
        { id, name: file.name, status: "uploading" },
      ]);

      try {
        await onUploadFile({ id, file });
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "uploaded" } : u))
        );
      } catch {
        setUploads((prev) => prev.filter((u) => u.id !== id));
      }
    }

    // allow re-selecting the same file
    e.target.value = "";
  };

  return (
    <div className="bg-opacity-5 bg-white rounded-2xl p-4 w-7/12 mx-auto">
      <form
        onSubmit={handleMessageButton}
        className="w-full flex items-center gap-2"
      >
        <input
          className="w-full h-full bg-transparent outline-none"
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />
        <Button
          type="button"
          variant="secondary"
          iconLeft={<Paperclip />}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
        >
          Attach
        </Button>
        <Button
          variant="primary"
          iconRight={isRunning ? <CircleX /> : <SendIcon />}
          type="submit"
          disabled={isUploading}
        />
      </form>

      {uploads.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {uploads.map((u) => (
            <span
              key={u.id}
              className={
                `inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ` +
                (u.status === "uploading"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-green-50 text-green-700")
              }
              title={u.name}
            >
              <span className="truncate max-w-[14rem]">{u.name}</span>
              <span className="opacity-70">
                {u.status === "uploading" ? "Uploading" : "Uploaded"}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveUpload(u.id)}
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10 cursor-pointer"
                aria-label={`Remove ${u.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
