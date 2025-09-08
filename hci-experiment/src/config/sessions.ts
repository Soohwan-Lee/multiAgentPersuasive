export const SESSION_META = {
  test: {
    name: "Practice Session",
    description: "Practice session to get familiar with the interface",
    taskType: "normative" as const, // test 세션은 normative task 사용
  },
  normative: { // main1을 normative으로 변경
    name: "Main Session 1", 
    description: "First main session with AI assistant chats",
    taskType: "normative" as const,
  },
  informative: { // main2를 informative로 변경
    name: "Main Session 2",
    description: "Second main session with AI assistant chats", 
    taskType: "informative" as const,
  },
} as const;

export type SessionKey = keyof typeof SESSION_META;
