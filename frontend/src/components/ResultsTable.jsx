export default function ResultsTable({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-3 py-2 font-medium">Rank</th>
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium">Planted</th>
            <th className="px-3 py-2 font-medium">Influence</th>
            <th className="px-3 py-2 font-medium">Text</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={`${item.id}-${idx}`} className="border-b border-zinc-100">
              <td className="px-3 py-2">{idx + 1}</td>
              <td className="px-3 py-2">{item.id}</td>
              <td className="px-3 py-2">{item.is_planted ? "YES" : "no"}</td>
              <td className="px-3 py-2">{Number(item.influence).toFixed(4)}</td>
              <td className="px-3 py-2">{item.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}