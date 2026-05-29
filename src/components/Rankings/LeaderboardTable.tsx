import React from 'react';

export type TableColumn<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T, index: number) => React.ReactNode;
};

type Props<T> = {
  rows: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  getRowKey: (row: T) => string;
};

export function LeaderboardTable<T>({
  rows,
  columns,
  loading = false,
  emptyMessage = 'No entries yet.',
  getRowKey,
}: Props<T>) {
  if (loading) {
    return (
      <div className="py-10 flex justify-center">
        <div className="w-6 h-6 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[16px] border border-[rgba(0,82,204,0.06)]">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="bg-[#EEF4FF]/60 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row)}
              className="border-t border-gray-50 hover:bg-[#EEF4FF]/30 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeaderboardTable;
