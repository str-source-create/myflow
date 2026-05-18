/**
 * ChecklistItem.jsx
 * Source file for the cleanflow application.
 */

export default function ChecklistItem({ item, onToggle }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
      <input
        type="checkbox"
        checked={item.completed}
        onChange={onToggle}
        className="h-6 w-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />

      <span className="flex-1 text-sm text-slate-800">
        <span className={item.completed ? 'text-green-700 line-through' : ''}>{item.title}</span>
      </span>

      {item.required && !item.completed ? <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> : null}
      {item.completed ? <span className="text-sm text-green-600">Done</span> : null}
    </label>
  )
}

