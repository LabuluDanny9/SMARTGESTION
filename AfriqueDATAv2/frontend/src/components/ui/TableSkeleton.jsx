import { Table } from 'react-bootstrap';

export default function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <Table responsive className="mb-0">
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i}>
              <div className="skeleton" style={{ height: 16, width: i === 0 ? 120 : 80 }} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, ri) => (
          <tr key={ri}>
            {Array.from({ length: cols }).map((_, ci) => (
              <td key={ci}>
                <div className="skeleton" style={{ height: 14, width: ci === 0 ? 140 : 90 }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
