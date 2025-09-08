// 세션 순서 설정
// 이 파일을 수정하여 세션 순서를 쉽게 변경할 수 있습니다.
// 향후 Supabase에서 조건별 세션 순서를 동적으로 불러올 수 있도록 확장 가능한 구조

export const SESSION_ORDER = {
  // 변경 가능한 설정들
  NORMATIVE_FIRST: ['normative', 'informative'] as const,
  INFORMATIVE_FIRST: ['informative', 'normative'] as const,
  
  // TODO: 여기에 다른 순서 조합을 추가할 수 있습니다
  // 예: RANDOM: ['informative', 'normative'] as const,
} as const;

// 세션 순서 타입 정의
export type SessionOrderType = typeof SESSION_ORDER[keyof typeof SESSION_ORDER];

// 조건별 세션 순서 인터페이스 (향후 Supabase 연동용)
export interface ConditionSessionOrder {
  condition: string;
  sessionOrder: SessionOrderType;
  participantId?: string; // 개별 참가자별 설정도 가능
}

// 현재 사용할 순서를 결정하는 함수 (확장 가능한 구조)
const determineSessionOrder = async (participantId?: string): Promise<SessionOrderType> => {
  // TODO: 향후 Supabase 연동 시 이 부분을 확장
  // 1. Supabase에서 participantId에 해당하는 조건 정보 조회
  // 2. 조건에 맞는 세션 순서 반환
  // 3. 캐싱 로직 추가
  
  // 현재는 환경 변수 기반으로 동작
  const envOrder = process.env.NEXT_PUBLIC_SESSION_ORDER;
  
  if (envOrder === 'informative-first') {
    return SESSION_ORDER.INFORMATIVE_FIRST;
  } else if (envOrder === 'normative-first') {
    return SESSION_ORDER.NORMATIVE_FIRST;
  }
  
  // 기본값: normative-first
  return SESSION_ORDER.NORMATIVE_FIRST;
};

// 향후 Supabase 연동을 위한 함수들 (현재는 주석 처리)
/*
// Supabase에서 조건별 세션 순서 조회
export const getSessionOrderFromSupabase = async (participantId: string): Promise<SessionOrderType | null> => {
  try {
    const { data, error } = await supabase
      .from('experiment_conditions')
      .select('session_order')
      .eq('participant_id', participantId)
      .single();

    if (error) {
      console.error('Error fetching session order from Supabase:', error);
      return null;
    }

    return data?.session_order || null;
  } catch (error) {
    console.error('Error in getSessionOrderFromSupabase:', error);
    return null;
  }
};

// 세션 순서 캐싱 (성능 최적화)
const sessionOrderCache = new Map<string, SessionOrderType>();

export const getCachedSessionOrder = async (participantId: string): Promise<SessionOrderType> => {
  if (sessionOrderCache.has(participantId)) {
    return sessionOrderCache.get(participantId)!;
  }

  const order = await getSessionOrderFromSupabase(participantId) || SESSION_ORDER.NORMATIVE_FIRST;
  sessionOrderCache.set(participantId, order);
  return order;
};
*/

// 현재 사용할 순서 (환경 변수 또는 기본값 사용)
// TODO: 향후 participantId를 받아서 Supabase에서 동적으로 조회하도록 변경
let CURRENT_SESSION_ORDER: SessionOrderType = SESSION_ORDER.NORMATIVE_FIRST;

// 초기화 함수
const initializeSessionOrder = async () => {
  CURRENT_SESSION_ORDER = await determineSessionOrder();
};

// 초기화 실행
initializeSessionOrder().catch(console.error);

// 현재 세션 순서를 가져오는 함수
export const getCurrentSessionOrder = () => CURRENT_SESSION_ORDER;

// 세션 순서에 따른 인덱스 매핑
export const getSessionIndex = (sessionKey: 'normative' | 'informative') => {
  return getCurrentSessionOrder().indexOf(sessionKey);
};

// 첫 번째 세션 키 가져오기
export const getFirstSession = () => getCurrentSessionOrder()[0];

// 두 번째 세션 키 가져오기
export const getSecondSession = () => getCurrentSessionOrder()[1];

// 세션이 첫 번째인지 확인
export const isFirstSession = (sessionKey: 'normative' | 'informative') => {
  return getSessionIndex(sessionKey) === 0;
};

// 세션이 두 번째인지 확인
export const isSecondSession = (sessionKey: 'normative' | 'informative') => {
  return getSessionIndex(sessionKey) === 1;
};

// 향후 Supabase 연동을 위한 동적 세션 순서 함수들
export const getDynamicSessionOrder = async (participantId?: string): Promise<SessionOrderType> => {
  // TODO: Supabase 연동 시 이 함수를 사용
  // return await getCachedSessionOrder(participantId);
  
  // 현재는 기존 로직 사용
return getCurrentSessionOrder();
};

export const getDynamicFirstSession = async (participantId?: string) => {
  const order = await getDynamicSessionOrder(participantId);
  return order[0];
};

export const getDynamicSecondSession = async (participantId?: string) => {
  const order = await getDynamicSessionOrder(participantId);
  return order[1];
};

// 세션 순서 유효성 검사
export const isValidSessionOrder = (order: any): order is SessionOrderType => {
  return Array.isArray(order) && 
         order.length === 2 && 
         order.includes('normative') && 
         order.includes('informative');
};
