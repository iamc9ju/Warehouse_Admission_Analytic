"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  source?: string;
  timestamp: string;
  usedGemini?: boolean;
};

const SUGGESTED_PROMPTS = [
  "📊 สรุปภาพรวมปี 2569",
  "🎯 รอบ TCAS ไหนยืนยันสิทธิ์สูงสุด?",
  "💻 สถิติวิศวกรรมคอมพิวเตอร์",
  "⚖️ เปรียบเทียบภาคปกติ vs ภาคพิเศษ",
  "⚠️ สาขาไหนมีคนสละสิทธิ์เยอะสุด?",
];

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: "👋 สวัสดีครับ! ผมคือ **TCAS DW AI Assistant** ผู้ช่วยวิเคราะห์ข้อมูลการรับสมัครนักศึกษา\n\nสามารถพิมพ์ถามสถิติผู้สมัคร, จำนวนยืนยันสิทธิ์, อัตราการคัดเลือก, เปรียบเทียบสาขา หรือดูแนวโน้ม TCAS ได้เลยครับ!",
      timestamp: "เมื่อสักครู่",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tcas_gemini_api_key") || "";
    }
    return "";
  });
  const [hasServerKey, setHasServerKey] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounterRef = useRef(1);

  // Check server status once
  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => {
        if (data?.hasServerApiKey) setHasServerKey(true);
      })
      .catch(() => {});
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSaveKey = (newKey: string) => {
    setApiKey(newKey);
    if (newKey.trim()) {
      localStorage.setItem("tcas_gemini_api_key", newKey.trim());
    } else {
      localStorage.removeItem("tcas_gemini_api_key");
    }
    setShowSettings(false);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? input).trim();
    if (!textToSend || loading) return;

    idCounterRef.current += 1;
    const currentId = `msg-${idCounterRef.current}`;
    const currentTime = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

    const userMsg: Message = {
      id: currentId,
      sender: "user",
      text: textToSend,
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      idCounterRef.current += 1;
      const aiReply: Message = {
        id: `msg-${idCounterRef.current}`,
        sender: "ai",
        text: data.reply || "ขออภัยครับ ไม่สามารถดึงข้อมูลได้ในขณะนี้",
        source: data.source,
        usedGemini: data.usedGemini,
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch {
      idCounterRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${idCounterRef.current}`,
          sender: "ai",
          text: "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้งครับ",
          timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    idCounterRef.current += 1;
    setMessages([
      {
        id: `msg-${idCounterRef.current}`,
        sender: "ai",
        text: "ล้างประวัติการสนทนาเรียบร้อยครับ สามารถถามคำถามใหม่ได้เลยครับ!",
        timestamp: "เมื่อสักครู่",
      },
    ]);
  };

  // Helper to render markdown-like text (bold, table, bullets) safely
  const renderMessageContent = (content: string) => {
    // If it contains a markdown table
    if (content.includes("|") && content.includes("\n|")) {
      const lines = content.split("\n");
      const elements: React.ReactNode[] = [];
      let inTable = false;
      let tableRows: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
          inTable = true;
          tableRows.push(line);
        } else {
          if (inTable) {
            elements.push(renderTable(tableRows, `table-${i}`));
            inTable = false;
            tableRows = [];
          }
          if (line.trim()) {
            elements.push(
              <p key={`p-${i}`} className="my-1 leading-relaxed">
                {parseFormattedText(line)}
              </p>
            );
          }
        }
      }
      if (inTable) {
        elements.push(renderTable(tableRows, `table-end`));
      }
      return elements;
    }

    // Regular paragraphs & bullets
    return content.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1" />;
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-gray-900 mt-2 mb-1 text-base">
            {trimmed.replace("### ", "")}
          </h4>
        );
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc my-0.5 text-sm leading-relaxed">
            {parseFormattedText(trimmed.slice(2))}
          </li>
        );
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote
            key={idx}
            className="border-l-4 border-amber-500 pl-3 py-1 my-2 text-xs bg-amber-50/70 text-amber-900 rounded-r"
          >
            {parseFormattedText(trimmed.slice(2))}
          </blockquote>
        );
      }
      return (
        <p key={idx} className="my-1 text-sm leading-relaxed">
          {parseFormattedText(trimmed)}
        </p>
      );
    });
  };

  const renderTable = (rows: string[], key: string) => {
    const parsedRows = rows
      .map((r) =>
        r
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1)
      )
      .filter((r) => r.length > 0 && !r[0]?.includes("---"));

    if (parsedRows.length === 0) return null;
    const header = parsedRows[0];
    const body = parsedRows.slice(1);

    return (
      <div key={key} className="overflow-x-auto my-3 rounded-lg border border-gray-200 text-xs shadow-xs">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100/90 text-gray-700 font-semibold">
            <tr>
              {header.map((col, idx) => (
                <th key={idx} className="px-2.5 py-1.5 text-left">
                  {parseFormattedText(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-2.5 py-1.5 whitespace-nowrap text-gray-800">
                    {parseFormattedText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper for bold text
  const parseFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {!isOpen && (
          <div className="mb-2 bg-white/95 backdrop-blur-xs text-xs font-medium text-gray-800 py-1 px-3 rounded-full shadow-md border border-amber-200 flex items-center gap-1.5 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ถาม AI ข้อมูล TCAS
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 150);
            }
          }}
          aria-label="เปิดหน้าต่างถาม-ตอบ AI"
          className="group relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 hover:scale-105 active:scale-95 text-white cursor-pointer"
          style={{ boxShadow: "0 10px 25px -5px rgba(217, 119, 6, 0.4)" }}
        >
          {isOpen ? (
            <svg className="w-6 h-6 transition-transform duration-200 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="relative">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Floating Chat Container */}
      {isOpen && (
        <section
          aria-label="TCAS DW AI Assistant"
          className="fixed bottom-24 right-6 z-50 w-[410px] max-w-[calc(100vw-32px)] h-[580px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-gray-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 text-white p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                  TCAS DW AI Assistant
                  <span className="text-[10px] bg-white/20 font-medium px-1.5 py-0.2 rounded-full">Live Neon</span>
                </h3>
                <p className="text-[11px] text-amber-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  พร้อมตอบข้อมูลสถิติรับสมัคร
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/90">
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="ตั้งค่า Gemini API Key"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button
                onClick={clearChat}
                title="ล้างแชต"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="ปิด"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Settings Sub-panel */}
          {showSettings && (
            <div className="bg-amber-50/90 border-b border-amber-200 p-3 text-xs animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-amber-900">ตั้งค่า Gemini API Key (เสริม)</span>
                <span className="text-[10px] text-gray-500">
                  {hasServerKey ? "✅ เซิร์ฟเวอร์มี Key พร้อม" : "💡 ใส่เพิ่มเพื่อคำตอบอิสระ"}
                </span>
              </div>
              <input
                type="password"
                placeholder="วาง Gemini API Key ที่นี่..."
                defaultValue={apiKey}
                id="gemini-key-input"
                className="w-full bg-white border border-amber-300 rounded-md px-2.5 py-1 text-xs outline-amber-500 mb-2"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-2 py-0.5 rounded text-gray-600 hover:bg-amber-100 cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  onClick={() => {
                    const inputEl = document.getElementById("gemini-key-input") as HTMLInputElement;
                    handleSaveKey(inputEl?.value || "");
                  }}
                  className="px-2.5 py-0.5 rounded bg-amber-600 text-white font-medium hover:bg-amber-700 cursor-pointer"
                >
                  บันทึก Key
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gray-50/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    msg.sender === "user"
                      ? "bg-amber-600 text-white rounded-br-xs shadow-xs"
                      : "bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs shadow-xs"
                  }`}
                >
                  {renderMessageContent(msg.text)}

                  {msg.source && (
                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                      <span>📌 แหล่งข้อมูล: {msg.source}</span>
                      {msg.usedGemini && (
                        <span className="text-amber-600 font-medium">✨ Powered by Gemini</span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-gray-500 ml-1">กำลังค้นหาข้อมูลสดใน Marts...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="px-3 py-1.5 bg-gray-50/70 border-t border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-none">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="whitespace-nowrap text-[11px] bg-white border border-gray-200 hover:border-amber-400 hover:text-amber-700 text-gray-600 px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-2.5 bg-white border-t border-gray-200">
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 px-2 py-1 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ถามสถิติ เช่น 'สถิติวิศวกรรมโยธา', 'รอบ TCAS1'..."
                className="flex-1 bg-transparent border-none outline-hidden text-xs text-gray-800 placeholder-gray-400 py-1.5 px-1"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                aria-label="ส่งข้อความ"
                className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-30 disabled:hover:bg-amber-600 text-white transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-1">
              ดึงข้อมูลสดจาก Neon PostgreSQL Marts
            </div>
          </div>
        </section>
      )}
    </>
  );
}
