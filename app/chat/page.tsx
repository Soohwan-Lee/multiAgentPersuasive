import React from "react";
import { useRef, useEffect } from "react";

const sampleMessages = [
  { sender: "Agent A", text: "안녕하세요! 무엇을 도와드릴까요?" },
  { sender: "나", text: "실험에 대해 설명해 주세요." },
  { sender: "Agent B", text: "이 실험은 여러 에이전트와 대화하는 실험입니다." },
  { sender: "나", text: "감사합니다!" },
];

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 flex flex-col" style={{ minHeight: 500 }}>
        <h1 className="text-2xl font-bold mb-4 text-center">멀티 에이전트 채팅</h1>
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {sampleMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "나" ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-2 rounded-lg text-sm max-w-[70%] ${msg.sender === "나" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-700"}`}>
                <span className="font-semibold mr-2">{msg.sender}:</span>{msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="flex gap-2 mt-2">
          <input
            type="text"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="메시지를 입력하세요... (샘플)"
            disabled
          />
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold opacity-60 cursor-not-allowed"
            disabled
          >
            전송
          </button>
        </form>
        <a href="/post-survey" className="block text-center mt-6 text-blue-600 hover:underline">사후 설문으로 이동</a>
      </div>
    </main>
  );
} 