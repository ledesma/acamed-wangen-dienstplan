export const TASK_ICON_NAMES: Record<string, string> = {
  Heart: 'favorite',
  FileText: 'description',
  AlertTriangle: 'warning',
  Users: 'group',
  GraduationCap: 'school',
  Clipboard: 'assignment',
  Clock: 'schedule',
  Stethoscope: 'medical_services',
  Thermometer: 'thermostat',
  Pill: 'medication',
  Syringe: 'vaccine',
  Activity: 'trending_up',
  Brain: 'psychology',
  Eye: 'visibility',
  Bone: 'accessibility_new'
};

export const TASK_ICON_OPTIONS = Object.keys(TASK_ICON_NAMES);

export const getTaskIcon = (iconName: string): string => {
  return TASK_ICON_NAMES[iconName] || 'help_outline';
};