import React, { useRef } from 'react';
import { Shift } from '../types';
import { formatShiftTimes } from '../utils/dateUtils';

interface ShiftLegendItemProps {
  shift: Shift;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  draggable?: boolean;
}

const ShiftLegendItem: React.FC<ShiftLegendItemProps> = ({
  shift,
  onDragStart,
  onDragEnd,
  draggable = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart?.(e);
    ref.current?.classList.add('dragging');
  };

  const handleDragEnd = () => {
    onDragEnd?.();
    ref.current?.classList.remove('dragging');
  };

  return (
    <div
      ref={ref}
      draggable={draggable}
      className="legend-item"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="legend-color" style={{ backgroundColor: shift.color }} />
      <div className="legend-info">
        <span className="legend-name">{shift.name}</span>
        <span className="legend-time">{formatShiftTimes(shift.times)}</span>
      </div>
    </div>
  );
};

export default ShiftLegendItem;
