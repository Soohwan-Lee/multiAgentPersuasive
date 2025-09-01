'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2, BarChart3 } from 'lucide-react';

interface Stats {
  totalConditions: number;
  assignedConditions: number;
  availableConditions: number;
  completedParticipants: number;
  activeParticipants: number;
  abandonedParticipants: number;
}

interface CleanupResult {
  cleanedCount: number;
  beforeStats: Stats;
  afterStats: Stats;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/cleanup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'dev-key'}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    try {
      setCleanupLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'dev-key'}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Cleanup failed');
      }
      
      const result = await response.json();
      setLastCleanup(result);
      setStats(result.afterStats);
      
    } catch (err) {
      console.error('Error running cleanup:', err);
      setError(err instanceof Error ? err.message : 'Cleanup failed');
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // 30초마다 자동 갱신
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin mr-2" />
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">실험 관리 대시보드</h1>
        <div className="flex gap-2">
          <Button onClick={fetchStats} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button onClick={runCleanup} disabled={cleanupLoading}>
            <Trash2 className={`mr-2 h-4 w-4 ${cleanupLoading ? 'animate-spin' : ''}`} />
            {cleanupLoading ? '정리 중...' : '중도 이탈자 정리'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          오류: {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 실험 조건</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConditions}</div>
              <p className="text-xs text-muted-foreground">
                사전 생성된 조건 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">배정된 조건</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.assignedConditions}</div>
              <p className="text-xs text-muted-foreground">
                현재 참가자에게 할당됨
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">사용 가능한 조건</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.availableConditions}</div>
              <p className="text-xs text-muted-foreground">
                새 참가자 배정 가능
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료된 참가자</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedParticipants}</div>
              <p className="text-xs text-muted-foreground">
                실험을 완료함
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 참가자</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activeParticipants}</div>
              <p className="text-xs text-muted-foreground">
                현재 실험 진행 중
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">중도 이탈자</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.abandonedParticipants}</div>
              <p className="text-xs text-muted-foreground">
                30분 이상 비활성
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {lastCleanup && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>최근 정리 작업 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>정리된 배정:</strong> {lastCleanup.cleanedCount}개</p>
              <p><strong>실행 시간:</strong> {new Date(lastCleanup.timestamp).toLocaleString('ko-KR')}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium">정리 전</h4>
                  <p>배정됨: {lastCleanup.beforeStats.assignedConditions}</p>
                  <p>사용 가능: {lastCleanup.beforeStats.availableConditions}</p>
                </div>
                <div>
                  <h4 className="font-medium">정리 후</h4>
                  <p>배정됨: {lastCleanup.afterStats.assignedConditions}</p>
                  <p>사용 가능: {lastCleanup.afterStats.availableConditions}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>진행률</CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>전체 진행률</span>
                  <span>{Math.round((stats.completedParticipants / stats.totalConditions) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(stats.completedParticipants / stats.totalConditions) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>조건 배정률</span>
                  <span>{Math.round((stats.assignedConditions / stats.totalConditions) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(stats.assignedConditions / stats.totalConditions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
