import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shift, Task } from '../types';
import { getTaskIcon } from '../utils/iconUtils';
import ShiftLegendItem from './ShiftLegendItem';

interface LegendProps {
  shifts: Shift[];
  tasks: Task[];
  draggable?: boolean;
  onShiftDragStart?: (shiftId: string) => void;
  onShiftDragEnd?: (shiftId: string) => void;
}

const Legend: React.FC<LegendProps> = ({
  shifts,
  tasks,
  draggable = false,
  onShiftDragStart,
  onShiftDragEnd,
}) => {
  const { t } = useTranslation();
  const activeShifts = shifts.filter(s => s.is_active);

  const handleDragStart = (shift: Shift, e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ shiftId: shift.id, shift }));
    e.dataTransfer.effectAllowed = 'copy';
    onShiftDragStart?.(shift.id);
  };

  const handleDragEnd = (shiftId: string) => {
    onShiftDragEnd?.(shiftId);
  };

  return (
    <div className="legend">
      <div className="legend-section">
        <div className="legend-label">{t('shifts')}</div>
        <div className="legend-items">
          {activeShifts.map(shift => (
            <ShiftLegendItem
              key={shift.id}
              shift={shift}
              draggable={draggable}
              onDragStart={draggable ? (e) => handleDragStart(shift, e) : undefined}
              onDragEnd={draggable ? () => handleDragEnd(shift.id) : undefined}
            />
          ))}
        </div>
      </div>
      <div className="legend-section">
        <div className="legend-label">{t('tasks')}</div>
        <div className="legend-items">
          {tasks.map(task => (
            <div key={task.id} className="legend-item small">
              <span className="material-symbols-rounded">{getTaskIcon(task.icon)}</span>
              <span className="legend-name">{task.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Legend;
