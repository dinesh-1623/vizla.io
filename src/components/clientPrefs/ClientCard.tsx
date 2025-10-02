import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Save, X, Copy, Trash2, Key, DollarSign, Check, X as XIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ClientPrefs, ClientPrefsFormData, ClientPriority } from '@/types/clientPrefs';

interface ClientCardProps {
  client: ClientPrefs;
  isSelected?: boolean;
  isEditing?: boolean;
  onEdit: () => void;
  onSave: (data: ClientPrefsFormData) => void;
  onCancel: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSelect: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  isSelected = false,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
  onSelect
}) => {
  const [formData, setFormData] = useState<ClientPrefsFormData>({
    name: client.name,
    priority: client.priority,
    clientRepoFeeUSD: client.clientRepoFeeUSD,
    flatbedPreApproved: client.flatbedPreApproved,
    keysRequired: client.keysRequired,
    notes: client.notes || ''
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset form data when client changes
  useEffect(() => {
    setFormData({
      name: client.name,
      priority: client.priority,
      clientRepoFeeUSD: client.clientRepoFeeUSD,
      flatbedPreApproved: client.flatbedPreApproved,
      keysRequired: client.keysRequired,
      notes: client.notes || ''
    });
  }, [client]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && !isEditing) {
        if (e.key === 'e' || e.key === 'Enter') {
          e.preventDefault();
          onEdit();
        } else if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onDuplicate();
        }
      }
    };

    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSelected, isEditing, onEdit, onDuplicate]);

  const handleFieldChange = (field: keyof ClientPrefsFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.clientRepoFeeUSD < 0 || formData.clientRepoFeeUSD > 1000) {
      newErrors.clientRepoFeeUSD = 'Fee must be between 0 and 1000';
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    if (!formData.keysRequired) {
      newErrors.keysRequired = 'Keys requirement is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: client.name,
      priority: client.priority,
      clientRepoFeeUSD: client.clientRepoFeeUSD,
      flatbedPreApproved: client.flatbedPreApproved,
      keysRequired: client.keysRequired,
      notes: client.notes || ''
    });
    setErrors({});
    onCancel();
  };

  const getPriorityColor = (priority: ClientPriority) => {
    switch (priority) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getKeysIcon = () => {
    switch (client.keysRequired) {
      case 'Required': return <Key className="w-4 h-4 text-red-400" />;
      case 'Preferred': return <Key className="w-4 h-4 text-yellow-400" />;
      case 'Not Required': return <Key className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <GlassCard
      ref={cardRef}
      className={`transition-all duration-200 cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : 'hover:bg-gray-500/5'
      } ${isEditing ? 'ring-2 ring-green-500/50 bg-green-500/5' : ''}`}
      onClick={!isEditing ? onSelect : undefined}
    >
      <div className="p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Client Name */}
            {isEditing ? (
              <div className="mb-2">
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`bg-vizla-glass border-vizla-glassBorder ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  placeholder="Client Name"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
            ) : (
              <h3 className="text-xl font-semibold text-vizla-text-primary mb-2">
                {client.name}
              </h3>
            )}

            {/* Priority Chips */}
            {!isEditing ? (
              <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as ClientPriority[]).map((priority) => (
                  <Badge
                    key={priority}
                    variant="outline"
                    className={`px-3 py-1 text-xs font-medium ${
                      client.priority === priority
                        ? getPriorityColor(priority)
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}
                  >
                    {priority}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="mb-2">
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleFieldChange('priority', value as ClientPriority)}
                >
                  <SelectTrigger className={`bg-vizla-glass border-vizla-glassBorder ${
                    errors.priority ? 'border-red-500' : ''
                  }`}>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority && <p className="text-red-400 text-sm mt-1">{errors.priority}</p>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  className="bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Priority (Read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-vizla-text-secondary">Priority</label>
            <div className="text-vizla-text-primary">
              {isEditing ? (
                <Badge className={getPriorityColor(formData.priority)}>
                  {formData.priority}
                </Badge>
              ) : (
                <Badge className={getPriorityColor(client.priority)}>
                  {client.priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Client Repo Fee */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-vizla-text-secondary">Client Repo Fee</label>
            {isEditing ? (
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                <Input
                  type="number"
                  value={formData.clientRepoFeeUSD}
                  onChange={(e) => handleFieldChange('clientRepoFeeUSD', parseFloat(e.target.value) || 0)}
                  className={`pl-10 bg-vizla-glass border-vizla-glassBorder ${
                    errors.clientRepoFeeUSD ? 'border-red-500' : ''
                  }`}
                  min="0"
                  max="1000"
                  step="5"
                />
                {errors.clientRepoFeeUSD && <p className="text-red-400 text-sm mt-1">{errors.clientRepoFeeUSD}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-vizla-text-primary">
                <DollarSign className="w-4 h-4 text-vizla-text-muted" />
                <span className="font-mono">${client.clientRepoFeeUSD}</span>
              </div>
            )}
          </div>

          {/* Flatbed Pre Approved */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-vizla-text-secondary">Flatbed Pre Approved</label>
            {isEditing ? (
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.flatbedPreApproved}
                  onCheckedChange={(checked) => handleFieldChange('flatbedPreApproved', checked)}
                />
                <span className="text-vizla-text-primary">
                  {formData.flatbedPreApproved ? 'Yes' : 'No'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-vizla-text-primary">
                {client.flatbedPreApproved ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <XIcon className="w-4 h-4 text-red-400" />
                )}
                <span>{client.flatbedPreApproved ? 'Yes' : 'No'}</span>
              </div>
            )}
          </div>

          {/* Keys Required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-vizla-text-secondary">Keys for all repos</label>
            {isEditing ? (
              <Select
                value={formData.keysRequired}
                onValueChange={(value) => handleFieldChange('keysRequired', value)}
              >
                <SelectTrigger className={`bg-vizla-glass border-vizla-glassBorder ${
                  errors.keysRequired ? 'border-red-500' : ''
                }`}>
                  <SelectValue placeholder="Select requirement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Required">Required</SelectItem>
                  <SelectItem value="Preferred">Preferred</SelectItem>
                  <SelectItem value="Not Required">Not Required</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 text-vizla-text-primary">
                {getKeysIcon()}
                <span>{client.keysRequired}</span>
                {/* TODO: Show tiny key icon on Tow Driver View cards when keysRequired === 'Required' */}
              </div>
            )}
            {errors.keysRequired && <p className="text-red-400 text-sm mt-1">{errors.keysRequired}</p>}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-sm font-medium text-vizla-text-secondary hover:text-vizla-text-primary transition-colors"
          >
            Notes {isExpanded ? '▼' : '▶'}
          </button>
          
          {isExpanded && (
            <div className="mt-2">
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="bg-vizla-glass border-vizla-glassBorder text-vizla-text-primary"
                  placeholder="Add notes about this client..."
                  rows={3}
                />
              ) : (
                <div className="p-3 bg-vizla-glass rounded-lg border border-vizla-glassBorder">
                  <p className="text-vizla-text-primary text-sm whitespace-pre-wrap">
                    {client.notes || 'No notes added'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-vizla-glassBorder">
          <div className="flex items-center justify-between text-xs text-vizla-text-muted">
            <span>ID: {client.id}</span>
            <div className="flex items-center gap-4">
              <span>Updated: {new Date(client.updatedAtISO).toLocaleDateString()}</span>
              {client.updatedBy && <span>By: {client.updatedBy}</span>}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
