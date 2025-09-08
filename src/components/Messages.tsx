import {
  Message,
  useThreadManagerSelector,
  MessageProvider,
  useThreadState,
} from "@crayonai/react-core";
import { AssistantMessageContainer } from "@crayonai/react-ui/Shell";
import clsx from "clsx";

export const RenderMessage = ({
  message,
  className,
}: {
  message: Message;
  className?: string;
}) => {
  const responseTemplates = useThreadManagerSelector(
    (store) => store.responseTemplates
  );

  if (message.role === "assistant") {
    return (
      <AssistantMessageContainer className={className}>
        {message.message?.map((stringOrTemplate, i) => {
          if (stringOrTemplate.type === "text") {
            const TextRenderer =
              responseTemplates["text"]?.Component || DefaultTextRenderer;

            return (
              <TextRenderer
                key={i}
                className="crayon-shell-thread-message-assistant__text"
              >
                {stringOrTemplate.text}
              </TextRenderer>
            );
          }

          const Template = responseTemplates[stringOrTemplate.name];
          const Fallback =
            responseTemplates["fallback"]?.Component || FallbackTemplate;
          return Template ? (
            <Template.Component key={i} {...stringOrTemplate.templateProps} />
          ) : (
            <Fallback
              key={i}
              name={stringOrTemplate.name}
              templateProps={stringOrTemplate.templateProps}
            />
          );
        })}
      </AssistantMessageContainer>
    );
  }

  return (
    <UserMessageContainer context={message.context}>
      {message.message}
    </UserMessageContainer>
  );
};

export const Messages = ({
  className,
  loader,
}: {
  className?: string;
  loader?: React.ReactNode;
}) => {
  const { messages, isRunning } = useThreadState();

  return (
    <div className={clsx("crayon-shell-thread-messages", className)}>
      {messages.map((message) => {
        if (message.isVisuallyHidden) {
          return null;
        }
        return (
          <MessageProvider key={message.id} message={message}>
            <RenderMessage message={message} />
          </MessageProvider>
        );
      })}
      {isRunning && <div>{loader}</div>}
    </div>
  );
};

export const UserMessageContainer = ({
  children,
  className,
  context,
}: {
  children?: React.ReactNode;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: any;
}) => {
  const fileUploads = context?.find(
    (c: { type?: string }) => c?.type === "user_file_upload"
  )?.files;

  debugger;

  return (
    <div className={clsx("crayon-shell-thread-message-user", className)}>
      <div className="crayon-shell-thread-message-user__content">
        {children}
      </div>
      {fileUploads?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {fileUploads?.map((f: { id: string; name: string }) => {
            return (
              <span
                key={f.id}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-green-50 text-green-700"
              >
                {f.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DefaultTextRenderer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={className}>{children}</div>;
};

const FallbackTemplate = () => {
  return null;
};
