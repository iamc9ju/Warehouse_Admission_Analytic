import {
  fetchExecutiveSummary,
  fetchRoundEfficiency,
  fetchMajorOpportunity,
  searchMajorStats,
  fetchProgramMix,
  fetchStatusFriction,
} from "./data-service";
import type { QueryRow } from "../../data/db/neon-client";

export type ChatResponse = {
  reply: string;
  source: string;
  groundedFacts?: Array<{ label: string; value: string | number }>;
  usedGemini: boolean;
};

function formatNum(val: unknown) {
  const n = Number(val);
  return Number.isFinite(n) ? new Intl.NumberFormat("th-TH").format(n) : String(val ?? "-");
}

export async function processAiQuery(
  userQuery: string,
  clientApiKey?: string
): Promise<ChatResponse> {
  const query = userQuery.trim().toLowerCase();
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

  // Extract year mentioned, default to latest 2569
  let year = 2569;
  if (query.includes("2567") || query.includes("67")) year = 2567;
  else if (query.includes("2568") || query.includes("68")) year = 2568;
  else if (query.includes("2569") || query.includes("69")) year = 2569;

  let factsSummary = "";
  let source = "admissions_dw Marts";
  let defaultReply = "";

  // 1. Overview / Summary / ภาพรวม
  if (
    query.includes("ภาพรวม") ||
    query.includes("สรุป") ||
    query.includes("ทั้งหมด") ||
    query.includes("overview") ||
    query.includes("ยอดรวม")
  ) {
    const summary = await fetchExecutiveSummary(year);
    const row = summary[0];
    source = "mart_admissions_executive_summary";
    factsSummary = JSON.stringify(summary, null, 2);

    if (row) {
      defaultReply = `### 📊 สรุปภาพรวมการรับสมัคร TCAS ปีการศึกษา ${row.academic_year}\n\n` +
        `* 👥 **จำนวนผู้สมัครทั้งหมด:** **${formatNum(row.unique_applicants)}** คน (ตัวเลือกการสมัคร ${formatNum(row.application_choices)} choices)\n` +
        `* 🎯 **ผู้มีสิทธิ์คัดเลือก:** **${formatNum(row.eligible_applicants)}** คน\n` +
        `* ✅ **ผู้ยืนยันสิทธิ์สำเร็จ:** **${formatNum(row.confirmed_applicants)}** คน\n` +
        `* 📈 **อัตราการยืนยันสิทธิ์ (Confirmed Rate):** **${row.confirmed_rate}%**\n` +
        `* ⚠️ **ผู้สละสิทธิ์:** **${formatNum(row.resigned_applicants)}** คน\n\n` +
        `> **ข้อสังเกต:** อัตรายืนยันสิทธิ์ภาพรวมอยู่ที่ประมาณ **${row.confirmed_rate}%** ของผู้สมัครทั้งหมด โดยมีสัดส่วนจากทั้ง 4 รอบ TCAS`;
    }
  }

  // 2. Rounds / TCAS 1-4 / รอบ
  else if (
    query.includes("รอบ") ||
    query.includes("tcas") ||
    query.includes("portfolio") ||
    query.includes("quota") ||
    query.includes("admission")
  ) {
    const rounds = await fetchRoundEfficiency(year);
    source = "mart_round_efficiency";
    factsSummary = JSON.stringify(rounds, null, 2);

    const sortedByRate = [...rounds].sort(
      (a, b) => Number(b.confirmed_rate) - Number(a.confirmed_rate)
    );
    const topRound = sortedByRate[0];

    defaultReply = `### 🎯 ประสิทธิภาพการรับสมัครแยกตามรอบ TCAS ปี ${year}\n\n` +
      `| รอบ TCAS | ชื่อรอบ | ผู้สมัคร (คน) | มีสิทธิ์ (คน) | ยืนยันสิทธิ์ (คน) | อัตรายืนยัน (%) |\n` +
      `| :--- | :--- | :---: | :---: | :---: | :---: |\n` +
      rounds
        .map(
          (r: QueryRow) =>
            `| **${r.tcas_round_code}** | ${r.tcas_round_name} | ${formatNum(r.unique_applicants)} | ${formatNum(r.eligible_applicants)} | **${formatNum(r.confirmed_applicants)}** | **${r.confirmed_rate}%** |`
        )
        .join("\n") +
      `\n\n💡 **ข้อสรุปเชิงกลยุทธ์:**\n` +
      `* รอบที่มี**อัตรายืนยันสิทธิ์สูงที่สุด** คือ **${topRound?.tcas_round_code} (${topRound?.tcas_round_name})** ที่ **${topRound?.confirmed_rate}%**\n` +
      `* รอบ TCAS3 (Admission) มักจะมีปริมาณ Choices และผู้สมัครสูงสุด แต่ต้องบริหารจัดการสัดส่วนการยืนยันสิทธิ์อย่างใกล้ชิด`;
  }

  // 3. Regular vs Special / ภาคปกติ vs ภาคพิเศษ
  else if (
    query.includes("ภาคพิเศษ") ||
    query.includes("ภาคปกติ") ||
    query.includes("เปรียบเทียบภาค") ||
    query.includes("ประเภทโครงการ")
  ) {
    const mix = await fetchProgramMix(year);
    source = "mart_program_type_mix";
    factsSummary = JSON.stringify(mix, null, 2);

    defaultReply = `### ⚖️ เปรียบเทียบสถิติ ภาคปกติ vs ภาคพิเศษ ปี ${year}\n\n` +
      `| ประเภทหลักสูตร | ผู้สมัคร (คน) | ยืนยันสิทธิ์ (คน) | อัตรายืนยันสิทธิ์ (%) |\n` +
      `| :--- | :---: | :---: | :---: |\n` +
      mix
        .map(
          (m: QueryRow) =>
            `| **${m.program_type}** | ${formatNum(m.applicant_count)} | ${formatNum(m.confirmed_count)} | **${m.confirmed_rate}%** |`
        )
        .join("\n") +
      `\n\n📌 **การวิเคราะห์:** ภาคปกติมีสัดส่วนผู้สมัครจำนวนมากที่สุด ส่วนภาคพิเศษมีสัดส่วนอัตรายืนยันสิทธิ์ที่น่าสนใจตามกลุ่มเป้าหมายเฉพาะ`;
  }

  // 4. Specific Major / ค้นหาสาขา
  else if (
    query.includes("คอม") ||
    query.includes("โยธา") ||
    query.includes("เครื่องกล") ||
    query.includes("ไฟฟ้า") ||
    query.includes("อุตสาหการ") ||
    query.includes("โลจิสติกส์") ||
    query.includes("อาหาร") ||
    query.includes("เกษตร") ||
    query.includes("สิ่งแวดล้อม") ||
    query.includes("สาขา")
  ) {
    // Extract keywords
    let keyword = "";
    if (query.includes("คอม")) keyword = "คอมพิวเตอร์";
    else if (query.includes("โยธา")) keyword = "โยธา";
    else if (query.includes("เครื่องกล")) keyword = "เครื่องกล";
    else if (query.includes("ไฟฟ้า")) keyword = "ไฟฟ้า";
    else if (query.includes("อุตสาหการ") || query.includes("โลจิสติกส์")) keyword = "อุตสาหการ";
    else if (query.includes("อาหาร")) keyword = "อาหาร";
    else if (query.includes("สิ่งแวดล้อม")) keyword = "สิ่งแวดล้อม";
    else keyword = "วิศวกรรม";

    const majors = await searchMajorStats(keyword);
    source = "mart_major_opportunity";
    factsSummary = JSON.stringify(majors.slice(0, 10), null, 2);

    defaultReply = `### 🎓 สถิติสาขาวิชาที่เกี่ยวข้องกับ "${keyword}"\n\n` +
      `| ปีการศึกษา | สาขาวิชา | ประเภท | ผู้สมัคร (คน) | ยืนยันสิทธิ์ (คน) | อัตรา (%) |\n` +
      `| :---: | :--- | :---: | :---: | :---: | :---: |\n` +
      majors
        .slice(0, 8)
        .map(
          (m: QueryRow) =>
            `| ${m.academic_year} | **${m.major_name}** | ${m.program_type} | ${formatNum(m.applicant_count)} | ${formatNum(m.confirmed_count)} | **${m.confirmed_rate}%** |`
        )
        .join("\n") +
      `\n\n*(แสดงเฉพาะรายการที่ตรงกับคำค้นหา)*`;
  }

  // 5. Drop-off / Friction / สละสิทธิ์ / จุดติดขัด
  else if (
    query.includes("สละสิทธิ์") ||
    query.includes("ยืนยันที่อื่น") ||
    query.includes("หลุด") ||
    query.includes("friction") ||
    query.includes("ปัญหา")
  ) {
    const friction = await fetchStatusFriction(year);
    source = "mart_status_friction";
    factsSummary = JSON.stringify(friction, null, 2);

    defaultReply = `### ⚠️ สถานะที่มีการ Drop-off สูงสุด ปีการศึกษา ${year}\n\n` +
      `สถานะของผู้สมัครที่ไม่นำไปสู่การยืนยันสิทธิ์ขั้นสุดท้าย:\n\n` +
      `| รอบ TCAS | สถานะที่ไม่ยืนยัน | จำนวนผู้สมัคร (คน) | สัดส่วน (% ของรอบ) |\n` +
      `| :---: | :--- | :---: | :---: |\n` +
      friction
        .map(
          (f: QueryRow) =>
            `| **${f.tcas_round_code}** | ${f.status_label} | ${formatNum(f.unique_applicants)} | **${f.share_pct}%** |`
        )
        .join("\n") +
      `\n\n💡 **ข้อเสนอแนะเชิงกลยุทธ์:** ปัญหาหลักเกิดจากการ *"ยืนยันที่อื่นแล้ว"* ในรอบ TCAS1 และ TCAS3 ควรมีการจัดกิจกรรม Open House หรือ Pre-orientation เพื่อเพิ่มความผูกพันกับคณะก่อนวันยืนยันสิทธิ์`;
  }

  // 6. Default: Top Majors by Demand
  else {
    const topMajors = await fetchMajorOpportunity(year, 5);
    source = "mart_major_opportunity";
    factsSummary = JSON.stringify(topMajors, null, 2);

    defaultReply = `### 🏆 5 สาขาวิชาที่มีผู้สมัครสูงสุด ปี ${year}\n\n` +
      `| อันดับ | สาขาวิชา | ประเภท | ผู้สมัคร (คน) | ยืนยันสิทธิ์ (คน) | อัตรายืนยัน (%) |\n` +
      `| :---: | :--- | :---: | :---: | :---: | :---: |\n` +
      topMajors
        .map(
          (m: QueryRow, i: number) =>
            `| **${i + 1}** | **${m.major_name}** | ${m.program_type} | ${formatNum(m.applicant_count)} | ${formatNum(m.confirmed_count)} | **${m.confirmed_rate}%** |`
        )
        .join("\n") +
      `\n\nคุณสามารถสอบถามเจาะลึกเพิ่มเติมได้ เช่น:\n` +
      `* *"เปรียบเทียบรอบ TCAS1 กับ TCAS3 ของปี ${year}"*\n` +
      `* *"สถิติของสาขาวิศวกรรมคอมพิวเตอร์ย้อนหลัง"* \n` +
      `* *"เปรียบเทียบภาคปกติกับภาคพิเศษ"*`;
  }

  // If Gemini API Key is provided, call Gemini for rich synthesis
  if (apiKey) {
    try {
      const geminiReply = await callGeminiApi(apiKey, userQuery, factsSummary, source, year);
      if (geminiReply) {
        return {
          reply: geminiReply,
          source,
          usedGemini: true,
        };
      }
    } catch (err) {
      console.error("Gemini API call failed, falling back to rule engine:", err);
    }
  }

  return {
    reply: defaultReply,
    source,
    usedGemini: false,
  };
}

async function callGeminiApi(
  apiKey: string,
  userQuery: string,
  groundedFacts: string,
  source: string,
  year: number
): Promise<string | null> {
  const systemInstruction = `คุณคือ "TCAS DW AI Assistant" ผู้ช่วยวิเคราะห์ข้อมูลการรับสมัคร TCAS คณะวิศวกรรมศาสตร์ กำแพงแสน
ตอบเป็นภาษาไทยอย่างกระชับ รวดเร็ว ตรงประเด็น ทันที ไม่ต้องเกริ่นนำยาว

กฎการตอบ:
1. ใช้ตัวเลขจริงจาก Grounded Facts เท่านั้น ห้ามเดาตัวเลข
2. นำเสนอด้วย Markdown ที่อ่านง่าย เช่น ตารางเปรียบเทียบสั้นๆ หรือ Bullet points
3. สรุปข้อคิดเห็นเชิงกลยุทธ์สั้นๆ 1-2 ข้อ`;

  const prompt = `คำถามของผู้ใช้: "${userQuery}"
ปีการศึกษาหลักที่อ้างอิง: ${year}
แหล่งข้อมูล: admissions_dw.${source}

Grounded Facts จากฐานข้อมูล Neon:
${groundedFacts}

กรุณาตอบคำถามโดยสรุปตัวเลขที่ชัดเจนและให้คำแนะนำเชิงวิเคราะห์:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
}
