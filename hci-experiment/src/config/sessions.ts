export const SESSION_META = {
  test: {
    name: "Practice Session",
    description: "Practice session to get familiar with the interface",
    taskType: "normative" as const, // test 세션은 normative task 사용
  },
  normative: { // main1을 normative으로 변경
    name: "Normative Session", 
    description: "Session focusing on normative arguments and social values",
    taskType: "normative" as const,
  },
  informative: { // main2를 informative로 변경
    name: "Informative Session",
    description: "Session focusing on informative arguments and factual evidence", 
    taskType: "informative" as const,
  },
} as const;

export type SessionKey = keyof typeof SESSION_META;
