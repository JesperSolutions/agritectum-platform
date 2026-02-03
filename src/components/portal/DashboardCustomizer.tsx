import React, { useState, useEffect } from 'react';
import { Settings, GripVertical, RotateCcw, Save, X } from 'lucide-react';
import { DashboardWidget, saveDashboardPreferences, resetToDefaults } from '../../services/dashboardCustomizationService';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';

interface DashboardCustomizerProps {
  widgets: DashboardWidget[];
  onSave: (widgets: DashboardWidget[]) => void;
  onClose: () => void;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({ 
  widgets: initialWidgets, 
  onSave, 
  onClose 
}) => {
  const { showSuccess, showError } = useToast();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets);
  const [saving, setSaving] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const handleToggleWidget = (widgetId: string) => {
    setWidgets(prev =>
      prev.map(w =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      )
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    logger.debug('Move up from index:', index);
    const newWidgets = [...widgets];
    [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
    setWidgets(newWidgets);
  };

  const handleMoveDown = (index: number) => {
    if (index === widgets.length - 1) return;
    logger.debug('Move down from index:', index);
    const newWidgets = [...widgets];
    [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
    setWidgets(newWidgets);
  };

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    logger.debug('Drag start:', widgetId);
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    logger.debug('Drop at index:', targetIndex, 'Dragged widget:', draggedWidget);
    if (!draggedWidget) return;

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
    if (draggedIndex === targetIndex) {
      setDraggedWidget(null);
      return;
    }

    const newWidgets = [...widgets];
    const [draggedItem] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedItem);
    logger.debug('New order:', newWidgets.map((w, i) => `${i}:${w.label}`).join(', '));
    setWidgets(newWidgets);
    setDraggedWidget(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update order based on current position for ALL widgets (enabled and disabled)
      const updated = widgets.map((w, idx) => ({
        ...w,
        order: idx + 1,
      }));
      logger.debug('Saving widget order:', updated.map((w, i) => `${i}:${w.label}(order=${w.order})`).join(', '));
      onSave(updated);
      showSuccess('Dashboard customization saved');
      onClose();
    } catch (error) {
      logger.error('Error saving dashboard preferences:', error);
      showError('Failed to save dashboard preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset dashboard to default settings? Your current customizations will be lost.')) {
      return;
    }

    setSaving(true);
    try {
      // Reset to initial defaults with proper order
      const reset = initialWidgets.map((w, idx) => ({
        ...w,
        order: idx + 1,
      }));
      onSave(reset);
      showSuccess('Dashboard reset to default settings');
      onClose();
    } catch (error) {
      logger.error('Error resetting dashboard:', error);
      showError('Failed to reset dashboard');
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = widgets.filter(w => w.enabled).length;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]'>
      <div className='bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[10000]'>
        {/* Header */}
        <div className='sticky top-0 bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between z-[10001]'>
          <div className='flex items-center gap-3'>
            <Settings className='w-6 h-6 text-slate-700' />
            <div>
              <h2 className='text-xl font-semibold text-slate-900'>Customize Dashboard</h2>
              <p className='text-sm text-slate-600 mt-1'>{enabledCount} of {widgets.length} sections enabled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-slate-200 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-slate-500' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-4'>
          <p className='text-sm text-slate-600 mb-6'>
            Enable or disable dashboard sections below. Drag to reorder. Changes save immediately.
          </p>

          {/* Widget List */}
          <div className='space-y-2'>
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => {
                  logger.debug('Drag start:', widget.id);
                  // Make sure we're dragging the whole widget, not the map
                  e.dataTransfer!.effectAllowed = 'move';
                  setDraggedWidget(widget.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer!.dropEffect = 'move';
                }}
                onDragLeave={() => {}}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  logger.debug('Drop at index:', index, 'Dragged widget:', draggedWidget);
                  if (!draggedWidget) return;

                  const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
                  if (draggedIndex === index) {
                    setDraggedWidget(null);
                    return;
                  }

                  const newWidgets = [...widgets];
                  const [draggedItem] = newWidgets.splice(draggedIndex, 1);
                  newWidgets.splice(index, 0, draggedItem);
                  logger.debug('New order:', newWidgets.map((w, i) => `${i}:${w.label}`).join(', '));
                  setWidgets(newWidgets);
                  setDraggedWidget(null);
                }}
                className={`p-4 border-2 rounded-lg transition-all cursor-move select-none ${
                  draggedWidget === widget.id ? 'opacity-50 bg-slate-100 border-slate-400' : 'hover:bg-slate-50 border-slate-200'
                } ${!widget.enabled ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'}`}
              >
                <div className='flex items-start gap-4'>
                  {/* Drag Handle */}
                  <div
                    className='p-1.5 text-slate-400 hover:text-slate-600 flex-shrink-0 cursor-grab active:cursor-grabbing mt-1 hover:bg-slate-200 rounded transition-colors'
                    title='Drag to reorder'
                  >
                    <GripVertical className='w-5 h-5' />
                  </div>

                  {/* Toggle Checkbox */}
                  <label className='flex items-start gap-3 flex-1 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={widget.enabled}
                      onChange={() => handleToggleWidget(widget.id)}
                      className='w-5 h-5 text-slate-700 rounded mt-1 flex-shrink-0 accent-slate-600'
                    />
                    <div className='flex-1'>
                      <p className={`font-medium ${widget.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                        {widget.label}
                      </p>
                      <p className='text-sm text-slate-600 mt-1'>{widget.description}</p>
                    </div>
                  </label>

                  {/* Move Buttons */}
                  <div className='flex flex-col gap-1 flex-shrink-0'>
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className='px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-300'
                      title='Move up'
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === widgets.length - 1}
                      className='px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-300'
                      title='Move down'
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className='bg-slate-100 border border-slate-300 rounded-lg p-4 mt-6'>
            <p className='text-sm text-slate-700'>
              <strong>💡 Tip:</strong> For large portfolios (200+ buildings), disable sections you don't need to focus on the data that matters most to you.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-between z-[10001]'>
          <button
            onClick={handleReset}
            className='flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium'
          >
            <RotateCcw className='w-4 h-4' />
            Reset to Defaults
          </button>

          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-medium'
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className='flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
            >
              <Save className='w-4 h-4' />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizer;
