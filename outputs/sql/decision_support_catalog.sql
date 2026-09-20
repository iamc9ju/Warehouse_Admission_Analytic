CREATE SCHEMA IF NOT EXISTS admissions_dw;

CREATE TABLE IF NOT EXISTS admissions_dw.dw_business_question_catalog (
    question_id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    question TEXT NOT NULL,
    mart_object TEXT NOT NULL,
    metrics TEXT NOT NULL,
    decision_owner TEXT NOT NULL,
    decision_use TEXT NOT NULL,
    quality_gate TEXT NOT NULL
);

TRUNCATE admissions_dw.dw_business_question_catalog;

INSERT INTO admissions_dw.dw_business_question_catalog (question_id, domain, question, mart_object, metrics, decision_owner, decision_use, quality_gate) VALUES
    ('BQ-001', 'Demand', 'สาขาไหน demand สูงแต่ยืนยันสิทธิ์ต่ำ', 'mart_major_opportunity', 'applicant_count, confirmed_rate', 'Admissions committee', 'จัดลำดับสาขาที่ต้องปรับ communication, quota หรือ offer strategy', 'Missing major = 0'),
    ('BQ-002', 'Round Strategy', 'รอบ TCAS ไหนมี conversion ดีที่สุด', 'mart_round_efficiency', 'confirmed_rate, unique_applicants', 'Curriculum and admissions planning', 'วางกลยุทธ์รอบรับสมัครและ allocation ของ seat/communication', 'Configured round coverage complete'),
    ('BQ-003', 'Conversion', 'สถานะใดเป็น friction หลักใน funnel', 'mart_status_friction', 'status_share, choices', 'Admissions operations', 'หาจุด drop-off และปรับ process ติดตามผู้สมัคร', 'Source rows reconciled'),
    ('BQ-004', 'Demand', 'แนวโน้มปี 2567-2569 เปลี่ยนอย่างไร', 'mart_admissions_year_change', 'applicant_delta, confirmed_delta, rate_delta', 'Faculty leadership', 'ใช้สรุปภาพรวมแนวโน้มและความเสี่ยงก่อนวางแผนปีถัดไป', 'Year coverage = 2567-2569'),
    ('BQ-006', 'Program Portfolio', 'สาขาไหนควรตรวจ quota หรือ seat allocation ก่อนปีถัดไป', 'mart_major_opportunity', 'applicant_count, confirmed_count, confirmed_rate', 'Faculty leadership', 'ระบุสาขาที่ demand สูงแต่ seat/confirmation outcome อาจไม่สมดุล', 'Missing major = 0'),
    ('BQ-007', 'Demand', 'สาขาไหนผู้สมัครลดลงมากผิดปกติ', 'mart_major_year_change', 'applicant_delta, applicant_change_pct', 'Admissions committee', 'วางแผน recovery campaign หรือปรับ positioning ของสาขา', 'Major mapping complete'),
    ('BQ-008', 'Demand', 'สาขาไหนโตสวนภาพรวม', 'mart_major_year_change', 'applicant_delta, applicant_change_pct', 'Faculty leadership', 'หา program signal ที่ควรขยายเป็นจุดขายของปีหน้า', 'Year coverage = 2567-2569'),
    ('BQ-009', 'Conversion', 'สาขาไหน confirmed rate สูงแต่ demand ต่ำ', 'mart_major_opportunity', 'applicant_count, confirmed_rate', 'Admissions committee', 'เลือกสาขาที่ควรเพิ่ม awareness เพราะ conversion quality ดี', 'Missing score = 0'),
    ('BQ-010', 'Round Strategy', 'รอบไหนมี volume สูงแต่ conversion ต่ำ', 'mart_round_efficiency', 'choices, unique_applicants, confirmed_rate', 'Admissions operations', 'ปรับ timing, communication และ follow-up สำหรับรอบที่มี leakage สูง', 'Configured round coverage complete'),
    ('BQ-011', 'Round Strategy', 'รอบไหนควรเป็น flagship recruitment round', 'mart_round_efficiency', 'confirmed_count, confirmed_rate, source_files', 'Faculty leadership', 'เลือก round ที่ควรใช้เป็นแกนสื่อสารและจัด resource', 'Source files reconciled'),
    ('BQ-012', 'Conversion', 'สถานะผ่านลำดับที่ดีกว่ากระทบ conversion แค่ไหน', 'mart_status_friction', 'choices, share_pct', 'Admissions operations', 'ปรับ expectation และ communication หลังประกาศผล', 'Source rows reconciled'),
    ('BQ-013', 'Program Portfolio', 'ภาคพิเศษต่างจากภาคปกติอย่างไร', 'mart_program_type_mix', 'applicant_count, confirmed_count, confirmed_rate', 'Curriculum planning', 'ประเมิน portfolio ของหลักสูตรและ positioning ของ program type', 'Major mapping complete');

CREATE TABLE IF NOT EXISTS admissions_dw.mart_decision_insight (
    insight_id TEXT PRIMARY KEY,
    business_question_id TEXT NOT NULL,
    priority INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    mart_object TEXT NOT NULL,
    metric_label TEXT NOT NULL,
    metric_value TEXT NOT NULL,
    decision TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    confidence TEXT NOT NULL,
    quality_gate TEXT NOT NULL
);

TRUNCATE admissions_dw.mart_decision_insight;

INSERT INTO admissions_dw.mart_decision_insight (insight_id, business_question_id, priority, category, title, summary, mart_object, metric_label, metric_value, decision, recommended_action, confidence, quality_gate) VALUES
    ('INS-001', 'BQ-001', 1, 'Demand', 'วิศวกรรมโยธา-โครงสร้างพื้นฐานมี demand สูงแต่ conversion ต่ำ', 'ปี 2569 มีผู้สมัคร 825 คน แต่อัตรายืนยันสิทธิ์ 7.64% ต่ำกว่าสาขา demand สูงอื่น', 'mart_major_opportunity', 'applicants / confirmed_rate', '825 applicants / 7.64% confirmed', 'ต้องตรวจ offer competitiveness และ communication flow ของสาขานี้', 'Review admission messaging, seat policy and follow-up timing', 'High', 'Missing major = 0'),
    ('INS-002', 'BQ-002', 2, 'Round Strategy', 'TCAS3 เป็นรอบที่สร้าง confirmed มากที่สุด', 'ปี 2569 TCAS3 มี confirmed 283 คน และ rate 17.47% สูงกว่าปี 2568', 'mart_round_efficiency', 'confirmed / confirmed_rate', '283 confirmed / 17.47% confirmed', 'ควรใช้ TCAS3 เป็นรอบหลักสำหรับ demand capture และ tracking', 'Allocate communication effort before and during TCAS3 confirmation window', 'High', 'Configured round coverage complete'),
    ('INS-003', 'BQ-003', 3, 'Conversion', 'สถานะไม่ผ่านการคัดเลือกเป็น share สูงสุด', 'ปี 2569 มี choices ไม่ผ่านการคัดเลือก 2,552 รายการ คิดเป็น 55.73%', 'mart_status_friction', 'choices / share', '2,552 choices / 55.73%', 'ต้องตรวจ capacity, eligibility criteria และ expectation setting', 'Publish clearer eligibility guidance and monitor high-demand majors', 'Medium', 'Source rows reconciled'),
    ('INS-004', 'BQ-004', 4, 'Demand', 'ผู้สมัครรวมลดลงแต่ confirmed เพิ่มขึ้น', 'ปี 2569 unique applicants ลดลง 154 คน แต่ confirmed เพิ่มขึ้น 17 คน', 'mart_admissions_year_change', 'applicant_delta / confirmed_delta', '-154 applicants / +17 confirmed', 'ควรรักษากระบวนการที่ช่วย conversion แต่หาสาเหตุ demand ลดลง', 'Separate demand-generation actions from confirmation-conversion actions', 'High', 'Year coverage = 2567-2569'),
    ('INS-006', 'BQ-007', 6, 'Demand', 'วิศวกรรมเครื่องกล-เกษตรเป็น demand drop risk', 'ปี 2569 applicants ลดลง 197 คนจากปี 2568 ในสาขาวิศวกรรมเครื่องกล-เกษตร', 'mart_major_year_change', 'applicant_delta', '-197 applicants', 'ต้องหาเหตุผล demand drop และปรับ positioning ก่อนรอบรับปีหน้า', 'Run program messaging review and compare competitor positioning', 'Medium', 'Major mapping complete'),
    ('INS-007', 'BQ-008', 7, 'Demand', 'วิศวกรรมอุตสาหการ-โลจิสติกส์โตสวนภาพรวม', 'ปี 2569 applicants เพิ่มขึ้น 157 คน แม้ภาพรวม unique applicants ลดลง', 'mart_major_year_change', 'applicant_delta', '+157 applicants', 'ใช้ signal นี้เป็นจุดขายและขยาย communication ในปีถัดไป', 'Promote logistics outcome stories and retain high-performing funnel messages', 'High', 'Year coverage = 2567-2569'),
    ('INS-008', 'BQ-009', 8, 'Program Portfolio', 'วิศวกรรมนวัตกรรมเพื่อการเกษตรและอุตสาหกรรม conversion สูงแต่ demand ต่ำ', 'ปี 2569 มี applicants 108 คน แต่ confirmed rate 33.33% สูงที่สุดในกลุ่มสาขา', 'mart_major_opportunity', 'applicants / confirmed_rate', '108 applicants / 33.33% confirmed', 'สาขานี้ควรเพิ่ม awareness เพราะผู้สมัครที่สนใจมีแนวโน้มยืนยันสูง', 'Increase targeted awareness while preserving applicant-fit messaging', 'Medium', 'Missing score = 0'),
    ('INS-009', 'BQ-010', 9, 'Round Strategy', 'TCAS1 มี volume สูงแต่ conversion ต่ำ', 'ปี 2569 TCAS1 มี applicants 1,324 คน แต่ confirmed rate 12.31% ต่ำกว่า TCAS3', 'mart_round_efficiency', 'applicants / confirmed_rate', '1,324 applicants / 12.31% confirmed', 'ควรปรับ follow-up และ expectation ในรอบ Portfolio', 'Strengthen post-shortlist communication and reduce uncertainty before confirmation', 'Medium', 'Configured round coverage complete'),
    ('INS-010', 'BQ-012', 10, 'Conversion', 'ผ่านการคัดเลือกในลำดับที่ดีกว่ายังเป็น friction ใหญ่', 'ปี 2569 status นี้มี 1,191 choices หรือ 26.01% ของทั้งหมด', 'mart_status_friction', 'choices / share', '1,191 choices / 26.01%', 'ต้องสื่อสาร value proposition ของหลักสูตรเร็วขึ้นก่อนผู้สมัครย้ายลำดับ', 'Move program-fit messaging earlier in the admissions journey', 'Medium', 'Source rows reconciled'),
    ('INS-011', 'BQ-013', 11, 'Program Portfolio', 'ภาคพิเศษมี demand ต่ำกว่าแต่ conversion สูงกว่าภาคปกติ', 'ปี 2569 ภาคพิเศษมี applicants 629 คน ยืนยัน 86 คน หรือ 13.67% เทียบกับภาคปกติ 3,950 คน ยืนยัน 459 คน หรือ 11.62%', 'mart_program_type_mix', 'applicants / confirmed_rate by program type', 'ภาคพิเศษ 629 / 13.67% vs ภาคปกติ 3,950 / 11.62%', 'ควรติดตาม conversion และ positioning แยกตามประเภทหลักสูตร', 'Add program-type filter to mart review and compare price/time positioning', 'High', 'Major mapping complete'),
    ('INS-013', 'BQ-006', 6, 'Program Portfolio', 'วิศวกรรมโยธา-โครงสร้างพื้นฐานควรตรวจ quota และ seat allocation', 'ปี 2569 มีผู้สมัครสูงสุด 825 คน ยืนยันสิทธิ์ 63 คน หรือ 7.64% สะท้อนความไม่สมดุลระหว่าง demand กับ confirmation outcome', 'mart_major_opportunity', 'applicants / confirmed / confirmed_rate', '825 applicants / 63 confirmed / 7.64%', 'ควรตรวจจำนวนที่นั่ง เงื่อนไข offer และสาเหตุที่ผู้สมัครไม่ยืนยันสิทธิ์', 'ทบทวน quota และ seat allocation ควบคู่กับปรับการติดตามหลังได้รับ offer', 'High', 'Missing major = 0'),
    ('INS-014', 'BQ-011', 11, 'Round Strategy', 'TCAS3 ควรเป็น flagship recruitment round', 'ปี 2569 TCAS3 สร้างผู้ยืนยันสิทธิ์สูงสุด 283 คน และมีอัตรายืนยันสิทธิ์ 17.47%', 'mart_round_efficiency', 'confirmed / confirmed_rate / source_files', '283 confirmed / 17.47% / 1 file', 'ควรใช้ TCAS3 เป็นแกนหลักของแผน recruitment และจัดทรัพยากรให้พร้อมช่วงยืนยันสิทธิ์', 'เพิ่ม communication และทีมติดตามก่อนและระหว่างช่วงยืนยันสิทธิ์ TCAS3', 'High', 'Source files reconciled');

CREATE TABLE IF NOT EXISTS admissions_dw.dw_decision_mart_contract (
    mart_object TEXT PRIMARY KEY,
    grain TEXT NOT NULL,
    source_objects TEXT NOT NULL,
    purpose TEXT NOT NULL
);

TRUNCATE admissions_dw.dw_decision_mart_contract;

INSERT INTO admissions_dw.dw_decision_mart_contract (mart_object, grain, source_objects, purpose) VALUES
    ('mart_major_opportunity', 'academic_year + major_code + major_name + program_type', 'fact_admission -> mart_major_conversion', 'Identify high-demand majors with weak confirmation conversion'),
    ('mart_round_efficiency', 'academic_year + tcas_round_code', 'fact_admission -> vw_admission_round_overview', 'Compare round-level conversion and confirmed volume'),
    ('mart_status_friction', 'academic_year + status_label', 'fact_admission -> vw_admission_round_status_distribution', 'Identify funnel statuses that explain applicant loss or operational friction'),
    ('mart_admissions_year_change', 'academic_year pair', 'fact_admission -> mart_admissions_executive_summary', 'Explain year-over-year movement in demand and conversion'),
    ('mart_major_year_change', 'academic_year pair + major_code + major_name', 'fact_admission -> mart_major_conversion', 'Detect major-level demand growth and decline against overall trend'),
    ('mart_program_type_mix', 'academic_year + program_type', 'fact_admission -> mart_major_conversion', 'Compare normal and special program tracks for portfolio planning');
