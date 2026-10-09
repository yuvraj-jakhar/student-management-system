export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "indigo",
  subtitle,
  trend,
}) {
  const colorSchemes = {
    indigo: {
      iconBg: "bg-indigo-50 text-indigo-600",
      accent: "border-l-indigo-600",
    },
    blue: {
      iconBg: "bg-blue-50 text-blue-600",
      accent: "border-l-blue-600",
    },
    emerald: {
      iconBg: "bg-emerald-50 text-emerald-600",
      accent: "border-l-emerald-600",
    },
    amber: {
      iconBg: "bg-amber-50 text-amber-600",
      accent: "border-l-amber-600",
    },
    purple: {
      iconBg: "bg-purple-50 text-purple-600",
      accent: "border-l-purple-600",
    },
    rose: {
      iconBg: "bg-rose-50 text-rose-600",
      accent: "border-l-rose-600",
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.indigo;

  return (
    <div
      className={`h-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between border-l-4 ${scheme.accent}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
            <Icon size={19} />
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {value !== undefined && value !== null ? value : "--"}
        </div>

        {(subtitle || trend) && (
          <div className="mt-2.5 flex items-center text-xs text-slate-500 gap-1.5 pt-2 border-t border-slate-100">
            {trend && (
              <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                {trend}
              </span>
            )}
            <span className="truncate text-slate-500 font-medium text-[11px]">
              {subtitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
