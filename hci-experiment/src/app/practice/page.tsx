import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Bot } from "lucide-react";
import Link from "next/link";

const dummyMessages = [
  { sender: "agent", name: "Agent A", text: "안녕하세요! 저는 Agent A입니다. 무엇이든 물어보세요." },
  { sender: "agent", name: "Agent B", text: "저는 Agent B입니다. 오늘 기분이 어떠신가요?" },
  { sender: "user", name: "나", text: "안녕하세요! 연습 세션이군요." },
];

export default function Practice() {
  const [input, setInput] = useState("");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-bold text-center">연습 세션</h1>
      <p className="text-center">여러 에이전트와 자유롭게 대화해보세요.<br />실제 실험과 동일한 환경입니다.</p>
      <div className="w-full max-w-md flex flex-col gap-2 border rounded-lg p-4 bg-white/80 shadow">
        <div className="flex flex-col gap-2 h-60 overflow-y-auto">
          {dummyMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}> 
              <div className={`flex items-center gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                {msg.sender === "agent" ? <Bot className="w-5 h-5 text-blue-500" /> : <User className="w-5 h-5 text-gray-500" />}
                <div className={`rounded-lg px-3 py-2 ${msg.sender === "agent" ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800"}`}>
                  <span className="block text-xs font-semibold">{msg.name}</span>
                  <span>{msg.text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 border rounded p-2"
            placeholder="메시지를 입력하세요 (동작 안함)"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled
          />
          <Button disabled>전송</Button>
        </div>
      </div>
      <Link href="/experiment">
        <Button>다음</Button>
      </Link>
    </main>
  );
} 