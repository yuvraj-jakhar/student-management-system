import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, ArrowRight, Calendar, Pin, ExternalLink } from "lucide-react";
import { getAllNotices } from "../services/notices";

export default function CampusNoticesWidget() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatest();
  }, []);

  const fetchLatest = async () => {
    try {
      const data = await getAllNotices();
      setNotices((data || []).slice(0, 3));
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!loading && notices.length === 0) return null;

  const getBadgeColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case "exam":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "placement":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "event":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Bell size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              RIET Circulars & Notices
            </h3>
            <p className="text-[11px] text-slate-400">
              Rajasthan Institute of Engineering & Technology broadcasts
            </p>
          </div>
        </div>

        <Link
          to="/notices"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
        >
          View All <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {notices.map((n) => (
          <Link
            key={n._id}
            to="/notices"
            className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-slate-50/60 transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getBadgeColor(
                    n.category
                  )}`}
                >
                  {n.category || "Academic"}
                </span>

                {n.is_pinned && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    <Pin size={9} className="fill-amber-700" /> Pinned
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition line-clamp-2 leading-snug">
                {n.title}
              </h4>
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {n.created_at
                  ? new Date(n.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "Recent"}
              </span>
              <span className="text-indigo-600 font-semibold group-hover:underline">
                Read &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
