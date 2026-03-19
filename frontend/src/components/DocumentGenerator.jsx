import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function DocumentGenerator() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleGenerate = async (type) => {
    setLoading(true);
    setStatus("Sedang membuat draf PDF...");
    try {
      const endpoint =
        type === "invoice"
          ? `${API_BASE_URL}/api/docs/generate/invoice`
          : `${API_BASE_URL}/api/docs/generate/packing-list`;

      const response = await axios.post(
        endpoint,
        {
          user_id: "guest_user",
          items: [], // Placeholder
        },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${type === "invoice" ? "Commercial_Invoice" : "Packing_List"}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-secondary/50 text-sm font-medium mb-2 leading-relaxed">
        Pilih surat yang ingin diproses secara otomatis.
      </p>

      <button
        onClick={() => handleGenerate("invoice")}
        disabled={loading}
        className="danantara-card flex items-center justify-between p-5 bg-slate-soft hover:bg-white transition-all w-full group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center text-accent text-xl">
            📄
          </div>
          <span className="font-black text-secondary">Commercial Invoice</span>
        </div>
        <span className="text-accent group-hover:translate-x-1 transition-transform">
          →
        </span>
      </button>

      <button
        onClick={() => handleGenerate("packing-list")}
        disabled={loading}
        className="danantara-card flex items-center justify-between p-5 bg-slate-soft hover:bg-white transition-all w-full group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-secondary text-xl font-bold">
            📦
          </div>
          <span className="font-black text-secondary">Packing List</span>
        </div>
        <span className="text-accent group-hover:translate-x-1 transition-transform">
          →
        </span>
      </button>

      {loading && (
        <div className="mt-4 flex items-center gap-3 text-secondary/40 font-bold text-xs uppercase tracking-widest animate-pulse">
          <div className="w-2 h-2 rounded-full bg-accent" />
          Proses Dokumen...
        </div>
      )}
    </div>
  );
}
