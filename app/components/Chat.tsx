"use client";

import { useState, useRef, useEffect } from "react";
import { fetchOpenAIResponse } from "../utils/fetchOpenAIResponse";
import Image from "next/image";
import MarkdownRenderer from "./MarkdownRenderer";
import AppVoice from "./AppVoice";
import UserVoice from "./UserVoice";
import ChatInputModal from "./ChatInputModal";

type ChatProps = {
  initialText?: string;
  interviewData: {
    resumeText?: string;
    jobDescriptionText: string;
    interviewType: string;
  };
};

const userAuthor = {
  username: "User",
  id: 1,
  avatarUrl: "/user-avatar.jpg",
};

const aiAuthor = {
  username: "Bob The Interviewer",
  id: 2,
  avatarUrl: "/male1.jpg",
};

type Message = {
  author: {
    username: string;
    id: number;
    avatarUrl: string;
  };
  text: string;
  type: string;
  timestamp: number;
};

type aiMessage = {
  role: string;
  content: string;
};

const Chat: React.FC<ChatProps> = ({ initialText, interviewData }) => {
  const [input, setInput] = useState("");
  const { resumeText, jobDescriptionText, interviewType } = interviewData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialMessage = {
    author: aiAuthor,
    text: initialText ?? "Hello, I am Bob the Interviewer. How can I help you?",
    type: "text",
    timestamp: +new Date(),
  };
  const resumeMessage = {
    role: "system",
    content: `You help students prepare for technical interviews.
      ------------
      INTERVIEW TYPE: ${interviewType}
      ------------
      RESUME: ${resumeText}
      ------------
      JOB DESCRIPTION: ${jobDescriptionText}
      ------------`,
  };
  const initialAiMessage = {
    role: "assistant",
    content:
      initialText ?? "Hello, I am Bob the Interviewer. How can I help you?",
  };
  const [chatMessages, setChatMessages] = useState<Message[]>([initialMessage]);
  const [aiMessages, setAiMessages] = useState<aiMessage[]>([
    resumeMessage,
    initialAiMessage,
  ]);
  const chatContainer = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const scroll = () => {
    const { offsetHeight, scrollHeight, scrollTop } =
      chatContainer.current as HTMLDivElement;
    if (scrollHeight >= scrollTop + offsetHeight) {
      chatContainer.current?.scrollTo(0, scrollHeight + 200);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setInput(""); // Clear input when modal is closed
  };

  useEffect(() => {
    scroll();
  }, [chatMessages]);

  const handleOnSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = e.currentTarget["input-field"].value;
    setInput("");
    setIsStreaming(true);
    setIsModalOpen(false);

    setChatMessages((messages) => [
      ...messages,
      {
        author: userAuthor,
        text: message,
        type: "text",
        timestamp: +new Date(),
      },
      {
        author: aiAuthor,
        text: "...",
        type: "text",
        timestamp: +new Date(),
      },
    ]);

    const messageToSend = [...aiMessages, { role: "user", content: message }];

    const response = await fetchOpenAIResponse(messageToSend, (msg) =>
      setChatMessages((messages) => [
        ...messages.slice(0, messages.length - 1),
        {
          author: aiAuthor,
          text: msg,
          type: "text",
          timestamp: +new Date(),
        },
      ])
    );

    setIsStreaming(false);

    setAiMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: response },
    ]);
  };

  const renderResponse = () => {
    return (
      <div ref={chatContainer} className="response">
        {chatMessages.map((m, index) => (
          <div
            key={index}
            className={`chat-line ${
              m.author.username === "User" ? "user-chat" : "ai-chat"
            }`}
          >
            <Image
              className="avatar"
              alt="avatar"
              src={m.author.avatarUrl}
              width={32}
              height={32}
            />
            <div style={{ width: 592, marginLeft: "16px" }}>
              <div className="message">
                <MarkdownRenderer>{m.text}</MarkdownRenderer>
              </div>
              {index < chatMessages.length - 1 && (
                <div className="horizontal-line" />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleTranscriptionComplete = (text: string) => {
    setInput(text);
    setIsModalOpen(true);
  };

  return (
    <div className="chat">
      {renderResponse()}
      {!isStreaming && chatMessages.length > 0 && (
        <div className="audio-player">
          <p style={{ marginRight: "30px" }}>Interviewer Audio</p>
          <AppVoice text={chatMessages[chatMessages.length - 1].text} />
        </div>
      )}
      <div className="chat-controls">
        {!isStreaming && chatMessages.length > 0 && (
          <ChatInputModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            onSubmit={handleOnSendMessage}
            input={input}
            setInput={setInput}
          />
        )}
      </div>
      {!isStreaming && !isModalOpen && chatMessages.length > 0 && (
        <div className="voice-controls" style={{ display: "flex" }}>
          <UserVoice onTranscriptionComplete={handleTranscriptionComplete} />
        </div>
      )}
    </div>
  );
};

export default Chat;
