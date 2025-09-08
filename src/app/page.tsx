"use client";

import {
  ThemeProvider,
  useThreadListManager,
  useThreadManager,
} from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";
import { ChatProvider } from "@crayonai/react-core";
import {
  Container,
  MessageLoading,
  MobileHeader,
  NewChatButton,
  ScrollArea,
  SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
  ThreadContainer,
  ThreadList,
} from "@crayonai/react-ui/Shell";
import { CustomComposer } from "../components/Composer";
import { Messages } from "../components/Messages";

export default function Home() {
  // Call relevant APIs to manage thread list here
  const threadListManager = useThreadListManager({
    fetchThreadList: async () => [],
    deleteThread: async () => {},
    updateThread: async (t) => t,
    onSwitchToNew: async () => {},
    onSelectThread: async () => {},
    createThread: async ({ message }) => {
      return {
        threadId: crypto.randomUUID(),
        title: message ?? "New Thread",
        createdAt: new Date(),
      };
    },
  });

  // Call relevant APIs to manage thread here
  const threadManager = useThreadManager({
    threadListManager,
    loadThread: async () => [],
    onUpdateMessage: async () => {},
    processMessage: async ({ messages, threadId }) => {
      const latestMessage = messages[messages.length - 1];
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          prompt: latestMessage,
          threadId,
          responseId: crypto.randomUUID(),
        }),
      });
      return response;
    },
  });

  return (
    <ThemeProvider>
      <ChatProvider
        threadListManager={threadListManager}
        threadManager={threadManager}
      >
        <Container
          logoUrl={"https://www.thesys.dev/favicon.ico"}
          agentName="C1Chat"
        >
          <SidebarContainer>
            <SidebarHeader />
            <SidebarContent>
              <NewChatButton />
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <CustomComposer
              onUploadFile={async ({ id, file }) => {
                const fd = new FormData();
                fd.append("file", file);
                fd.append("id", id);
                const res = await fetch("/api/files", {
                  method: "POST",
                  body: fd,
                });
                if (!res.ok) throw new Error("Upload failed");
                return res.json();
              }}
            />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </ThemeProvider>
  );
}
