interface DataTableProps {
  headers: string[];
  rows: string[][];
}

/** Plain table of text cells. */
export function DataTable({ headers, rows }: DataTableProps) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              className="px-3 py-2 text-xs font-medium text-slate-400"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i} className="border-t border-slate-800">
            {cells.map((text, j) => (
              <td key={j} className="px-3 py-2 whitespace-nowrap tabular-nums">
                {text}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
