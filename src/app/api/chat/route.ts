import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";
import { DBMessage, getMessageStore } from "./messageStore";
import { getFileStore } from "../files/fileStore";

export async function POST(req: NextRequest) {
  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: DBMessage;
    threadId: string;
    responseId: string;
  };
  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed/",
    apiKey:
      "sk-th-dTy9Pf1XSxlkSGp7VbSSV27aNDlev7QRaDnFkNrnnWcSuCjTzTozhiSiC3kLiAllw16ZrAEE7TJiQLkaCTu3wA0spyhAndhZc9KF",
  });
  const messageStore = getMessageStore(threadId);

  messageStore.addMessage(prompt);

  const llmStream = await client.beta.chat.completions.runTools({
    model: "c1/anthropic/claude-sonnet-4/v-20250815",
    messages: messageStore.getOpenAICompatibleMessageList(),
    stream: true,
    tools: [
      {
        type: "function",
        function: {
          name: "read_file",
          description: "read a file from the server using the file id",
          parameters: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "the id of the file to read",
              },
            },
          },
          parse: (input) => {
            return JSON.parse(input);
          },
          function: async ({ id }: { id: string }) => {
            console.log("fetching file", { id });
            const file = getFileStore().getFile(id);
            console.log(
              "existing files",
              JSON.stringify(getFileStore().listFiles(), null, 2)
            );
            if (!file) {
              throw new Error("File not found");
            }
            return {
              type: "file",
              file: file.data,
            };
          },
        },
      },
    ],
  });

  const responseStream = transformStream(
    llmStream,
    (chunk) => {
      return chunk.choices?.[0]?.delta?.content ?? "";
    },
    {
      onEnd: ({ accumulated }) => {
        const message = accumulated.filter((message) => message).join("");
        messageStore.addMessage({
          role: "assistant",
          content: message,
          id: responseId,
        });
      },
    }
  ) as ReadableStream<string>;

  return new NextResponse(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
