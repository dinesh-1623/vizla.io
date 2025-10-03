import React, { useState } from 'react';
import { Upload, X, Plus, MapPin } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SpotterFormData, PRESET_NOTES, LOCATION_TYPES, PARKED_OPTIONS } from '@/lib/types/spotter';

interface SpotterFormProps {
  formData: SpotterFormData;
  onFormDataChange: (data: Partial<SpotterFormData>) => void;
  clients: Array<{ id: string; name: string; address?: string }>;
  errors: Record<string, string>;
}

export const SpotterForm: React.FC<SpotterFormProps> = ({
  formData,
  onFormDataChange,
  clients,
  errors,
}) => {
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [customNote, setCustomNote] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleFieldChange = (field: keyof SpotterFormData, value: any) => {
    onFormDataChange({ [field]: value });
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1600;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      try {
        img.src = URL.createObjectURL(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Limit to 5 images total
    const currentPhotos = formData.photos || [];
    const remainingSlots = 5 - currentPhotos.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      alert(`You can only upload up to 5 images total. ${files.length - remainingSlots} images were not added.`);
    }
    
    try {
      const compressedFiles = await Promise.all(filesToProcess.map(compressImage));
      const newPhotos = [...currentPhotos, ...compressedFiles];
      handleFieldChange('photos', newPhotos);
    } catch (error) {
      console.error('Error compressing images:', error);
      alert('Error processing images. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos?.filter((_, i) => i !== index) || [];
    handleFieldChange('photos', newPhotos);
  };

  const addCustomNote = () => {
    if (customNote.trim() && !formData.notes.includes(customNote.trim())) {
      handleFieldChange('notes', [...formData.notes, customNote.trim()]);
      setCustomNote('');
    }
  };

  const removeNote = (noteToRemove: string) => {
    handleFieldChange('notes', formData.notes.filter(note => note !== noteToRemove));
  };

  const togglePresetNote = (note: string) => {
    if (formData.notes.includes(note)) {
      removeNote(note);
    } else {
      handleFieldChange('notes', [...formData.notes, note]);
    }
  };

  const openGoogleMaps = () => {
    if (formData.address) {
      const encodedAddress = encodeURIComponent(formData.address);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Client Selection */}
      <div className="space-y-2">
        <Label htmlFor="client">Client *</Label>
        <div className="relative">
          <Input
            id="client"
            value={clientSearch}
            onChange={(e) => {
              setClientSearch(e.target.value);
              setShowClientDropdown(true);
              handleFieldChange('client', e.target.value);
            }}
            onFocus={() => setShowClientDropdown(true)}
            placeholder="Search or type client name..."
            className={errors.client ? 'border-red-500' : ''}
          />
          {showClientDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                  onClick={() => {
                    handleFieldChange('client', client.name);
                    setClientSearch(client.name);
                    setShowClientDropdown(false);
                  }}
                >
                  <div className="font-medium text-white">{client.name}</div>
                  {client.address && (
                    <div className="text-sm text-gray-400">{client.address}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.client && <p className="text-red-400 text-sm">{errors.client}</p>}
      </div>

      {/* Vehicle Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vin">VIN *</Label>
          <Input
            id="vin"
            value={formData.vin}
            onChange={(e) => handleFieldChange('vin', e.target.value.toUpperCase())}
            placeholder="Vehicle Identification Number"
            className={errors.vin ? 'border-red-500' : ''}
          />
          {errors.vin && <p className="text-red-400 text-sm">{errors.vin}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plate">Plate *</Label>
          <Input
            id="plate"
            value={formData.plate}
            onChange={(e) => handleFieldChange('plate', e.target.value.toUpperCase())}
            placeholder="License Plate"
            className={errors.plate ? 'border-red-500' : ''}
          />
          {errors.plate && <p className="text-red-400 text-sm">{errors.plate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            type="number"
            value={formData.year || ''}
            onChange={(e) => handleFieldChange('year', parseInt(e.target.value))}
            placeholder="2024"
            min="1900"
            max={new Date().getFullYear() + 1}
            className={errors.year ? 'border-red-500' : ''}
          />
          {errors.year && <p className="text-red-400 text-sm">{errors.year}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="make">Make *</Label>
          <Input
            id="make"
            value={formData.make}
            onChange={(e) => handleFieldChange('make', e.target.value)}
            placeholder="Ford"
            className={errors.make ? 'border-red-500' : ''}
          />
          {errors.make && <p className="text-red-400 text-sm">{errors.make}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => handleFieldChange('model', e.target.value)}
            placeholder="F-150"
            className={errors.model ? 'border-red-500' : ''}
          />
          {errors.model && <p className="text-red-400 text-sm">{errors.model}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color *</Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => handleFieldChange('color', e.target.value)}
            placeholder="White"
            className={errors.color ? 'border-red-500' : ''}
          />
          {errors.color && <p className="text-red-400 text-sm">{errors.color}</p>}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <div className="flex gap-2">
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="123 Main St, Baltimore, MD 21201"
            className={errors.address ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openGoogleMaps}
            disabled={!formData.address}
            className="px-3"
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>
        {errors.address && <p className="text-red-400 text-sm">{errors.address}</p>}
      </div>

      {/* Status Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Reachable *</Label>
          <Select value={formData.reachable} onValueChange={(value) => handleFieldChange('reachable', value)}>
            <SelectTrigger className={errors.reachable ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select reachability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Reachable">Reachable</SelectItem>
              <SelectItem value="Not reachable">Not reachable</SelectItem>
            </SelectContent>
          </Select>
          {errors.reachable && <p className="text-red-400 text-sm">{errors.reachable}</p>}
        </div>

        <div className="space-y-2">
          <Label>Rusted *</Label>
          <Select value={formData.rusted} onValueChange={(value) => handleFieldChange('rusted', value)}>
            <SelectTrigger className={errors.rusted ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select rust status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not rusted">Not rusted</SelectItem>
              <SelectItem value="Rusted">Rusted</SelectItem>
            </SelectContent>
          </Select>
          {errors.rusted && <p className="text-red-400 text-sm">{errors.rusted}</p>}
        </div>

        <div className="space-y-2">
          <Label>Location Type *</Label>
          <Select value={formData.locationType} onValueChange={(value) => handleFieldChange('locationType', value)}>
            <SelectTrigger className={errors.locationType ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.locationType && <p className="text-red-400 text-sm">{errors.locationType}</p>}
        </div>
      </div>

      {/* Parked */}
      <div className="space-y-2">
        <Label>Parked *</Label>
        <Select value={formData.parked} onValueChange={(value) => handleFieldChange('parked', value)}>
          <SelectTrigger className={errors.parked ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select parking position" />
          </SelectTrigger>
          <SelectContent>
            {PARKED_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.parked && <p className="text-red-400 text-sm">{errors.parked}</p>}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes</Label>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESET_NOTES.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => togglePresetNote(note)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  formData.notes.includes(note)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                }`}
              >
                {note}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Add custom note..."
              onKeyPress={(e) => e.key === 'Enter' && addCustomNote()}
            />
            <Button type="button" onClick={addCustomNote} size="sm" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {formData.notes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.notes.map((note, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                >
                  {note}
                  <button
                    type="button"
                    onClick={() => removeNote(note)}
                    className="hover:text-blue-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Photos * (Max 5)</Label>
        
        {/* Photo Previews */}
        {formData.photos && formData.photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {formData.photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={(() => {
                    try {
                      return URL.createObjectURL(photo);
                    } catch (error) {
                      console.error('Error creating preview URL:', error);
                      return '';
                    }
                  })()}
                  alt={`Vehicle photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-600"
                  onError={(e) => {
                    console.error('Preview image failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <label
          htmlFor="photoFile"
          className={`block w-full border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 transition-colors ${
            errors.photos ? 'border-red-500' : 'border-gray-600'
          }`}
        >
          <div className="p-8 text-center bg-vizla-glass rounded-xl">
            <div className="text-gray-400">
              <Upload className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg mb-2">
                {formData.photos && formData.photos.length > 0 
                  ? `Add More Photos (${formData.photos.length}/5)`
                  : 'Upload Vehicle Photos'
                }
              </p>
              <p className="text-sm">JPG, PNG, or HEIC up to 10MB each</p>
              <p className="text-xs mt-2">Tap to select files (up to 5 total)</p>
            </div>
          </div>
        </label>
        
        <input
          id="photoFile"
          type="file"
          accept="image/jpeg,image/png,image/heic"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        {errors.photos && <p className="text-red-400 text-sm">{errors.photos}</p>}
      </div>
    </div>
  );
};

