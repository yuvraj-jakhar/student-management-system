export default function Loader({ text = "Loading records..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin"></div>
      </div>
      <p className="text-slate-500 font-semibold text-xs tracking-wide">{text}</p>
    </div>
  );
}
