import { readFileSync } from 'fs';
import { join } from 'path';
import { supabase } from '../src/lib/supabase';

async function runMigrations() {
  console.log('🔄 데이터베이스 마이그레이션 시작...');

  try {
    // SQL 파일 읽기
    const sqlPath = join(__dirname, '../migrations/001_create_tables.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    // SQL 문들을 세미콜론으로 분리
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 ${statements.length}개의 SQL 문을 실행합니다...`);

    // 각 SQL 문 실행
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`실행 중... (${i + 1}/${statements.length})`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ SQL 실행 오류 (${i + 1}번째):`, error);
        console.error('실패한 SQL:', statement);
        return;
      }
    }

    console.log('✅ 마이그레이션 완료!');
    console.log('📋 생성된 테이블:');
    console.log('  - participants');
    console.log('  - sessions');
    console.log('  - turns');
    console.log('  - messages');
    console.log('  - events');

  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
  }
}

runMigrations();
