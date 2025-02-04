"use client";

import { useRef } from "react";
import { useChat } from "ai/react";
import clsx from "clsx";
import { LoadingCircle, SendIcon } from "./icons";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Textarea from "react-textarea-autosize";
import { toast } from "sonner";

const examples = [
  {
    text: "Let me know the latest 5 posts that Daniel Primo has published in",
    link: "https://webreactiva.substack.com/",
    linkText: "Web Reactiva",
  },
  {
    text: "How many posts are already published in",
    link: "https://cosasdefreelance.substack.com/",
    linkText: "Cosas de Freelance?",
  },
  {
    text: "Has Sara recommended something new in the latest edition of",
    link: "https://lapsicoletter.substack.com/",
    linkText: "La Psicoletter?",
  },
];

export default function Chat() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    onResponse: (response) => {
      if (response.status === 429) {
        toast.error("You have reached your request limit for the day.");
        console.log("Rate limited");
        return;
      } else {
        console.log("Chat initiated");
      }
    },
    onError: (error) => {
      console.log("Chat errored", {
        input,
        error: error.message,
      });
    },

    maxSteps: 5,
  });

  const disabled = isLoading || input.length === 0;

  return (
    <main className="flex flex-col items-center justify-between pb-40">
      {messages.length > 0 ? (
        messages.map((message, i) => (
          <div
            key={i}
            className={clsx(
              "flex w-full items-center justify-center border-b border-gray-200 py-8",
              message.role === "user" ? "bg-white" : "bg-gray-100",
            )}
          >
            <div className="flex w-full max-w-screen-md items-start space-x-4 px-5 sm:px-0">
              <div
                className={clsx(
                  "p-1.5 text-white",
                  message.role === "assistant" ? "bg-green-500" : "bg-black",
                )}
              >
                {message.role === "user" ? (
                  <User width={20} />
                ) : (
                  <Bot width={20} />
                )}
              </div>
              {message.toolInvocations ? (
                <div className="flex flex-col space-y-2">
                  {message.toolInvocations?.map((invocation, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      Calling {invocation.toolName} tool...
                    </div>
                  ))}
                </div>
              ) : (
                <ReactMarkdown
                  className="prose mt-1 w-full break-words prose-p:leading-relaxed"
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (props) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="border-gray-200sm:mx-0 mx-5 mt-20 max-w-screen-md rounded-md border sm:w-full">
          <div className="flex flex-col space-y-4 p-7 sm:p-10">
            <h1 className="text-center text-lg font-semibold text-black">
              Chat with Substack Newsletters
            </h1>
            <p className="text-center text-sm text-gray-500">
              This chat uses AI to interact with Substack newsletters. It can
              fetch recent posts, count published articles, summarize content,
              and extract resources from posts.
            </p>
          </div>
          <div className="flex flex-col space-y-4 border-t border-gray-200 bg-gray-50 p-7 sm:p-10">
            {examples.map((example, i) => (
              <button
                key={i}
                className="rounded-md border border-gray-200 bg-white px-5 py-3 text-left text-sm text-gray-500 transition-all duration-75 hover:border-black hover:text-gray-700 active:bg-gray-50"
                onClick={() => {
                  setInput(
                    example.text + (example.link ? ` ${example.link}` : ""),
                  );
                  inputRef.current?.focus();
                }}
              >
                {example.text}
                {example.link && (
                  <a
                    href={example.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-500 hover:underline"
                  >
                    {example.linkText || "Learn more"}
                  </a>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="fixed bottom-0 flex w-full flex-col items-center space-y-3 bg-gradient-to-b from-transparent via-gray-100 to-gray-100 p-5 pb-3 sm:px-0">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="relative w-full max-w-screen-md rounded-xl border border-gray-200 bg-white px-4 pb-2 pt-3 shadow-lg sm:pb-3 sm:pt-4"
        >
          <Textarea
            ref={inputRef}
            tabIndex={0}
            required
            rows={1}
            autoFocus
            placeholder="Send a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                formRef.current?.requestSubmit();
                e.preventDefault();
              }
            }}
            spellCheck={false}
            className="w-full pr-10 focus:outline-none"
          />
          <button
            className={clsx(
              "absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-md transition-all",
              disabled
                ? "cursor-not-allowed bg-white"
                : "bg-green-500 hover:bg-green-600",
            )}
            disabled={disabled}
          >
            {isLoading ? (
              <LoadingCircle />
            ) : (
              <SendIcon
                className={clsx(
                  "h-4 w-4",
                  input.length === 0 ? "text-gray-300" : "text-white",
                )}
              />
            )}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400">
          Experimenting with OpenAI Functions and Vercel AI SDK. The AI can
          access Substack feeds, count posts, summarize content, and extract
          resources.
        </p>
      </div>
    </main>
  );
}
