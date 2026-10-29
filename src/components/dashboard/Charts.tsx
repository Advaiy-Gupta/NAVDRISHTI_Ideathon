import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryId } from '../../data/types';

// Validated two-series palette (dataviz validator, light surface): received / resolved.
export const SERIES = { received: '#2A78AB', resolved: '#C47F1F' };
const AXIS = { fontSize: 12, fill: '#667085' };
const GRID = '#E8ECF0';

const tooltipStyle = {
  contentStyle: { border: '1px solid #DCE1E6', borderRadius: 3, fontSize: 12, boxShadow: 'none' },
  labelStyle: { color: '#202B36', fontWeight: 600 },
  itemStyle: { color: '#202B36' },
};

/**
 * Horizontal bar list built from buttons, so every row is a full-width,
 * keyboard-operable filter control.
 */
export function CategoryBarChart({
  data,
  selected,
  onSelect,
}: {
  data: { id: CategoryId; label: string; count: number }[];
  selected: CategoryId | '';
  onSelect: (id: CategoryId) => void;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <ul className="space-y-0.5">
      {data.map((d) => {
        const active = !selected || selected === d.id;
        return (
          <li key={d.id}>
            <button
              onClick={() => onSelect(d.id)}
              aria-pressed={selected === d.id}
              title={`${d.label}: ${d.count} complaints. Select to filter.`}
              className="grid w-full grid-cols-[150px_1fr] items-center gap-3 rounded-sm px-1 py-2.5 text-left sm:py-1 hover:bg-[#F1F4F7] sm:grid-cols-[170px_1fr]"
            >
              <span className={`truncate text-xs ${selected === d.id ? 'font-semibold text-ink' : 'text-muted'}`}>{d.label}</span>
              <span className="flex items-center gap-2">
                <span
                  className="block h-[18px] rounded-r"
                  style={{ width: `${Math.max((d.count / max) * 88, 1)}%`, background: active ? '#244C66' : '#B9C7D2' }}
                />
                <span className="text-xs text-ink tnum">{d.count}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function TrendChart({ data }: { data: { month: string; received: number; resolved: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="month" tick={AXIS} axisLine={{ stroke: '#DCE1E6' }} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tooltipStyle} cursor={{ stroke: '#667085', strokeDasharray: '3 3' }} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: '#202B36' }} />
        <Line
          type="linear"
          dataKey="received"
          name="Received"
          stroke={SERIES.received}
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
          isAnimationActive={false}
        />
        <Line
          type="linear"
          dataKey="resolved"
          name="Recorded as resolved"
          stroke={SERIES.resolved}
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
