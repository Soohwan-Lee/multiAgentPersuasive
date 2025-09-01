import { NextRequest, NextResponse } from 'next/server';
import { cleanupAbandonedAssignments, getConditionAssignmentStats } from '@/lib/supabase';

// 중도 이탈자 정리 API
export async function POST(request: NextRequest) {
  try {
    // 보안을 위한 간단한 API 키 체크 (선택사항)
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting cleanup of abandoned assignments...');
    
    // 정리 전 상태 조회
    const beforeStats = await getConditionAssignmentStats();
    
    // 중도 이탈자 정리 실행
    const cleanedCount = await cleanupAbandonedAssignments();
    
    // 정리 후 상태 조회
    const afterStats = await getConditionAssignmentStats();
    
    console.log(`Cleanup completed. ${cleanedCount} assignments were reset.`);
    
    return NextResponse.json({
      success: true,
      cleanedCount,
      beforeStats,
      afterStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 조건 배정 상태 조회 API
export async function GET(request: NextRequest) {
  try {
    // 보안을 위한 간단한 API 키 체크 (선택사항)
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await getConditionAssignmentStats();
    
    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
