export const TASK_ICON_NAMES: Record<string, string> = {
  Heart: 'favorite',
  FileText: 'description',
  AlertTriangle: 'warning',
  Users: 'group',
  Laboratory: 'Biotech',
  Clipboard: 'assignment',
  Clock: 'schedule',
  Stethoscope: 'Stethoscope',
  Thermometer: 'device_thermostat',
  Pill: 'Pill',
  Syringe: 'syringe',
  Activity: 'trending_up',
  Phone: 'Call',
  Eye: 'visibility',
  Bone: 'accessibility_new'
};

export const TASK_ICON_OPTIONS = Object.keys(TASK_ICON_NAMES);

export const getTaskIcon = (iconName: string): string => {
  return TASK_ICON_NAMES[iconName] || 'help_outline';
};