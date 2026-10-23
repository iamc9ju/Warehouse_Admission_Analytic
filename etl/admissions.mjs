import { createHash, createHmac } from 'node:crypto';
import path from 'node:path';

const required = ['citizen_id', 'project_id', 'major_id', 'major_name', 'major_type', 'fac_id', 'fac_name', 'score', 'priority', 'tcas_status', 'applicant_status'];
const rounds = { TCAS1: 'Portfolio', TCAS2: 'Quota', TCAS3: 'Admission', TCAS4: 'Direct Admission' };
const aliases = { 'ยืนยันสิทธิ์ clearing-house': 'ยืนยันสิทธิ์', 'สัมภาษณ์ผ่าน': 'ผ่านการคัดเลือก', 'ปกติ': 'ไม่ผ่านการคัดเลือก' };

// Strict RFC-style CSV parser: embedded commas, quotes, BOM and multiline cells.
export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, '');
  const records = [];
  let row = [], cell = '', quoted = false, closed = false;
  const push = () => { row.push(cell); cell = ''; closed = false; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === '"') {
      if (cell || closed) throw new Error('Invalid CSV quoting');
      quoted = true;
    } else if (c === ',') push();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      push(); records.push(row); row = [];
    } else {
      if (closed) throw new Error('Unexpected text after CSV quote');
      cell += c;
    }
  }
  if (quoted) throw new Error('Unterminated CSV quote');
  if (cell || row.length || closed) { push(); records.push(row); }
  const headers = records.shift()?.map(v => v.trim());
  if (!headers?.length || headers.some(v => !v) || new Set(headers).size !== headers.length) throw new Error('Missing or duplicate CSV headers');
  return { headers, records };
}

export function transformCsv(text, { year, round, source, salt }) {
  if (!Number.isInteger(year) || year < 2500 || year > 2700) throw new Error('Year must be between 2500 and 2700');
  if (!rounds[round]) throw new Error('Round must be TCAS1, TCAS2, TCAS3 or TCAS4');
  if (!source || path.basename(source) !== source) throw new Error('Source must be a stable file identifier without a directory');
  if (typeof salt !== 'string' || salt.length < 16) throw new Error('ADMISSIONS_STUDENT_HASH_SALT must contain at least 16 characters');
  const { headers, records } = parseCsv(text);
  const missing = required.filter(k => !headers.includes(k));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`);
  const token = (namespace, value) => createHmac('sha256', salt).update(`${namespace}:${value}`).digest('hex');
  const errors = [], rows = [], identities = new Set();
  for (const [index, cells] of records.entries()) {
    const record = index + 2;
    const fail = (field, code) => errors.push({ record, field, code });
    if (cells.length !== headers.length) { fail('csv', 'column_count'); continue; }
    const raw = Object.fromEntries(headers.map((key, i) => [key, cells[i].trim()]));
    const before = errors.length;
    for (const field of required.filter(k => !['priority', 'applicant_status'].includes(k))) if (!raw[field]) fail(field, 'required');
    if (!/^\d{13}$/.test(raw.citizen_id)) fail('citizen_id', 'expected_13_digits');
    const numeric = (field, precision, scale, nullable = false) => {
      const value = raw[field];
      if (!value && nullable) return null;
      const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value);
      if (!match || match[2].replace(/^0+/, '').length > precision - scale || (match[3]?.length ?? 0) > scale) {
        fail(field, 'invalid_numeric'); return null;
      }
      return Number(value);
    };
    const score = numeric('score', 12, 4);
    const priority = numeric('priority', 10, 4, true);
    const status = numeric('applicant_status', 10, 0, true);
    if (status !== null && (status < -2147483648 || status > 2147483647)) fail('applicant_status', 'out_of_range');
    // Mutable score/status and row ordering are deliberately excluded from identity.
    const identity = JSON.stringify([year, round, raw.citizen_id, raw.project_id, raw.fac_id, raw.major_id, raw.major_type, priority]);
    const application = token('application-v2', identity);
    if (identities.has(application)) fail('application', 'duplicate_identity');
    identities.add(application);
    if (errors.length !== before) continue;
    rows.push({ application_token: application, student_token: token('student', raw.citizen_id), academic_year: year,
      tcas_round_code: round, tcas_round_name: rounds[round], fac_id: raw.fac_id, fac_name: raw.fac_name,
      major_id: raw.major_id, major_name: raw.major_name, major_type: raw.major_type,
      tcas_status: aliases[raw.tcas_status] ?? raw.tcas_status, applicant_status: status,
      source_file: source, source_row_number: record, priority, score });
  }
  if (!records.length) errors.push({ record: 1, field: 'csv', code: 'empty_file' });
  return { rows, report: { source, year, round, checksum: createHash('sha256').update(text).digest('hex'),
    sourceRows: records.length, validRows: rows.length, invalidRows: new Set(errors.map(e => e.record)).size,
    uniqueApplicants: new Set(rows.map(r => r.student_token)).size, errors } };
}
