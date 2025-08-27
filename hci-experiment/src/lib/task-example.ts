import { 
  INFORMATIVE_TASKS, 
  NORMATIVE_TASKS, 
  getSelectedTask, 
  getTaskType, 
  getAllTasks, 
  isValidTask 
} from './prompts';

// 세션 순서 설정 (현재는 normative가 먼저 나오도록 하드코딩)
// TODO: 나중에 랜덤하게 변경하거나 환경변수로 설정 가능하도록 수정
export const SESSION_ORDER = ["normative", "informative"] as const; // normative가 먼저, informative가 나중에
// const SESSION_ORDER = ["informative", "normative"] as const; // informative가 먼저, normative가 나중에

// Task 시스템 사용 예시
export function demonstrateTaskSystem() {
  console.log("=== Task System Demonstration ===\n");

  // 1. 모든 task 리스트 확인
  const allTasks = getAllTasks();
  console.log("📋 All Available Tasks:");
  console.log("Informative Tasks:", allTasks.informative.length);
  console.log("Normative Tasks:", allTasks.normative.length);
  console.log();

  // 2. 선택된 task 확인 (하드코딩된 인덱스)
  const selectedInformative = getSelectedTask("informative");
  const selectedNormative = getSelectedTask("normative");
  
  console.log("🎯 Selected Task (Hardcoded Index):");
  console.log("Informative:", selectedInformative);
  console.log("Normative:", selectedNormative);
  console.log();

  // 3. Task 타입 확인
  console.log("🔍 Task Type Detection:");
  console.log(`"${selectedInformative}" -> ${getTaskType(selectedInformative)}`);
  console.log(`"${selectedNormative}" -> ${getTaskType(selectedNormative)}`);
  console.log();

  // 4. Task 검증
  console.log("✅ Task Validation:");
  console.log(`"${selectedInformative}" is valid: ${isValidTask(selectedInformative)}`);
  console.log(`"Invalid task" is valid: ${isValidTask("Invalid task")}`);
  console.log();

  // 5. 세션 순서 확인
  console.log("🎯 Session Order:");
  SESSION_ORDER.forEach((sessionType, index) => {
    const task = getSelectedTask(sessionType);
    console.log(`${index + 1}. ${sessionType}: "${task}"`);
  });
}

// API에서 사용할 수 있는 task 선택 함수
export function selectTaskForSession(sessionKey: "test" | "normative" | "informative"): string {
  const taskType = sessionKey === "informative" ? "informative" : "normative";
  return getSelectedTask(taskType);
}

// Task 정보를 포함한 응답 객체
export interface TaskInfo {
  task: string;
  taskType: "informative" | "normative";
  sessionKey: "test" | "normative" | "informative";
}

export function getTaskInfo(sessionKey: "test" | "normative" | "informative"): TaskInfo {
  const task = selectTaskForSession(sessionKey);
  const taskType = getTaskType(task);
  
  return {
    task,
    taskType,
    sessionKey
  };
}

// 세션 순서에 따른 task 정보 가져오기
export function getSessionTasks(): TaskInfo[] {
  return SESSION_ORDER.map(sessionKey => getTaskInfo(sessionKey));
}

// 실제 사용 예시
export function getCurrentSessionTask(sessionKey: "test" | "normative" | "informative"): string {
  // test 세션은 normative task 사용
  if (sessionKey === "test") {
    return getSelectedTask("normative");
  }
  
  // normative/informative 세션은 각각 해당하는 task 사용
  return getSelectedTask(sessionKey);
}

// 세션 순서 변경 함수 (나중에 사용)
export function setSessionOrder(order: ("normative" | "informative")[]): void {
  // TODO: 환경변수나 설정 파일에 저장
  console.log("Session order changed to:", order);
}

// Task 인덱스 변경 함수 (나중에 사용)
export function setTaskIndex(taskType: "normative" | "informative", index: number): void {
  // TODO: 환경변수나 설정 파일에 저장
  console.log(`${taskType} task index changed to:`, index);
}
