import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, transformCsv } from '../etl/admissions.mjs';
import { openWarehouse, loadLocal } from '../etl/local-warehouse.mjs';

const header = 'citizen_id,project_id,major_id,major_name,major_type,fac_id,fac_name,score,priority,tcas_status,applicant_status';
const a = '0000000000001,P1,M1,Engineering,Normal,F1,Faculty,25.5,1,ผู้สมัคร,1';
const b = '0000000000001,P1,M1,Engineering,Special,F1,Faculty,30,2,ยืนยันสิทธิ์,2';
const c = '0000000000002,P1,M2,Computing,Normal,F1,Faculty,35,1,ผู้สมัคร,1';
const options = { year: 2569, round: 'TCAS1', source: 'test.csv', salt: 'synthetic-test-salt-only' };
const batch = (lines = [a, b, c], changes = {}) => transformCsv([header, ...lines].join('\n'), { ...options, ...changes });

test('CSV accepts BOM, quotes, CRLF and multiline cells; rejects malformed files', () => {
  assert.deepEqual(parseCsv('\uFEFFa,b\r\n"x, y","line\n""quote"""\r\n').records, [['x, y', 'line\n"quote"']]);
  for (const input of ['a,a\n1,2', 'a\n"open', 'a\n"ok"bad', 'a\nb"ad']) assert.throws(() => parseCsv(input));
});

test('transform uses allowlist, preserves leading-zero identifiers and legacy student HMAC', async () => {
  const { createHmac } = await import('node:crypto');
  const result = batch();
  assert.equal(result.report.errors.length, 0);
  assert.equal(result.report.uniqueApplicants, 2);
  assert.equal(result.rows[0].student_token, createHmac('sha256', options.salt).update('student:0000000000001').digest('hex'));
  assert.equal('citizen_id' in result.rows[0], false);
  assert.equal(JSON.stringify(result).includes('0000000000001'), false);
  assert.equal(result.rows[0].student_token, result.rows[1].student_token);
  assert.notEqual(result.rows[0].application_token, result.rows[1].application_token);
});

test('validation rejects missing columns, empty files, duplicates and malformed numeric fields without exposing values', () => {
  assert.throws(() => transformCsv('x\n1', options), /Missing columns/);
  assert.ok(batch([]).report.errors.length);
  for (const lines of [[a, a], [a.replace('25.5', 'NaN')], [a.replace('25.5', '1.12345')], [a.replace('25.5', '100000000')], [a.replace('0000000000001', 'private-invalid-id')], [a + ',extra']]) {
    const report = batch(lines).report;
    assert.ok(report.errors.length);
    assert.equal(JSON.stringify(report).includes('private-invalid-id'), false);
  }
  assert.throws(() => batch([a], { year: 2026 }), /Year/);
  assert.throws(() => batch([a], { salt: 'short' }), /SALT/);
});

test('local load supports retry, correction, reordered rows and new rounds without deleting old facts', () => {
  const db = openWarehouse();
  try {
    assert.deepEqual(loadLocal(db, batch(), 'same-salt'), { inserted: 3, updated: 0, totalFacts: 3 });
    assert.deepEqual(loadLocal(db, batch(), 'same-salt'), { inserted: 0, updated: 3, totalFacts: 3 });
    const fixed = a.replace('25.5', '40').replace('ผู้สมัคร,1', 'ยืนยันสิทธิ์,2');
    assert.equal(loadLocal(db, batch([c, fixed, b]), 'same-salt').totalFacts, 3);
    assert.equal(db.prepare('SELECT score FROM fact_admission WHERE application_token=?').get(batch([a]).rows[0].application_token).score, 40);
    assert.equal(db.prepare('SELECT count(*) AS n FROM dim_major').get().n, 3);
    assert.equal(db.prepare('SELECT count(*) AS n FROM dim_student').get().n, 2);
    assert.equal(loadLocal(db, batch([a], { round: 'TCAS2', source: 'round2.csv' }), 'same-salt').totalFacts, 4);
    assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
    assert.throws(() => loadLocal(db, batch(), 'different-salt'), /Salt changed/);
    assert.equal(db.prepare('SELECT count(*) AS n FROM fact_admission').get().n, 4);
  } finally { db.close(); }
});

test('a mid-load failure rolls back facts, dimensions, staging and run log', () => {
  const db = openWarehouse();
  try {
    loadLocal(db, batch([a]), 'same-salt');
    const broken = batch([b, c]);
    broken.rows[1].score = null;
    assert.throws(() => loadLocal(db, broken, 'same-salt'));
    assert.equal(db.prepare('SELECT count(*) AS n FROM fact_admission').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM dim_major').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM etl_runs').get().n, 1);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_temp_master WHERE name='stage_admission_fact'").get().n, 0);
    assert.throws(() => loadLocal(db, batch([a, a]), 'same-salt'), /Validation/);
  } finally { db.close(); }
});
