import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpotterForm } from '@/components/spotter/SpotterForm';
import { SpotterCard } from '@/components/spotter/SpotterCard';
import { useSpotterStore } from '@/lib/store/spotterStore';
import { SpotterFormData, SpotterSubmission } from '@/lib/types/spotter';
import { useToast } from '@/hooks/use-toast';
import { Eye, Camera, Download, Save, ArrowLeft, Home } from 'lucide-react';

const NewSpotter: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, setCurrentUser, saveDraft, clearDraft } = useSpotterStore();
  
  const [formData, setFormData] = useState<SpotterFormData>({
    client: '',
    vin: '',
    year: 0,
    make: '',
    model: '',
    color: '',
    plate: '',
    address: '',
    reachable: 'Reachable',
    rusted: 'Not rusted',
    locationType: 'Single Family Home',
    parked: 'Pulled in',
    notes: [],
    photos: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<Array<{ id: string; name: string; address?: string }>>([]);
  const [isValid, setIsValid] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [tempUser, setTempUser] = useState(currentUser);

  // Load clients data
  useEffect(() => {
    fetch('/data/clients.json')
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => {
        console.error('Failed to load clients:', err);
        setClients([]);
      });
  }, []);

  // Load draft if exists
  useEffect(() => {
    const draftId = 'new-spotter-draft';
    const draft = useSpotterStore.getState().getDraft(draftId);
    if (draft) {
      setFormData(prev => ({ ...prev, ...draft }));
    }
  }, []);

  // Validate form
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.client.trim()) newErrors.client = 'Client is required';
    if (!formData.vin.trim()) newErrors.vin = 'VIN is required';
    else if (formData.vin.length < 11 || formData.vin.length > 17) {
      newErrors.vin = 'VIN must be 11-17 characters';
    }
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Valid year is required';
    }
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.color.trim()) newErrors.color = 'Color is required';
    if (!formData.plate.trim()) newErrors.plate = 'Plate is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.photos || formData.photos.length === 0) newErrors.photos = 'At least one photo is required';
    
    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [formData]);

  // Auto-save draft
  useEffect(() => {
    const draftId = 'new-spotter-draft';
    const timeoutId = setTimeout(() => {
      saveDraft(draftId, formData);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [formData, saveDraft]);

  const handleFormDataChange = (changes: Partial<SpotterFormData>) => {
    setFormData(prev => ({ ...prev, ...changes }));
  };


  const handleSaveDraft = () => {
    const draftId = 'new-spotter-draft';
    saveDraft(draftId, formData);
    toast({
      title: 'Draft saved',
      description: 'Your spotter intake has been saved as a draft.',
    });
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    const submission: SpotterSubmission = {
      id: crypto.randomUUID(),
      createdBy: currentUser,
      createdAtISO: new Date().toISOString(),
      client: formData.client,
      vin: formData.vin,
      year: formData.year,
      make: formData.make,
      model: formData.model,
      color: formData.color,
      plate: formData.plate,
      address: formData.address,
      reachable: formData.reachable,
      rusted: formData.rusted,
      locationType: formData.locationType,
      parked: formData.parked,
      notes: formData.notes,
      photoUrls: (() => {
        try {
          return formData.photos?.map(photo => 
            photo instanceof File ? URL.createObjectURL(photo) : ''
          ).filter(url => url) || [];
        } catch (error) {
          console.error('Error creating object URLs for submission:', error);
          return [];
        }
      })()
    };

    try {
      // Save to IndexedDB (simplified for demo)
      const submissions = JSON.parse(localStorage.getItem('spotter-submissions') || '[]');
      submissions.unshift(submission);
      localStorage.setItem('spotter-submissions', JSON.stringify(submissions));

      // In development, also append to JSON file
      if (import.meta.env.DEV) {
        await fetch('/api/spotter-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission)
        }).catch(() => {
          // Ignore errors in dev mode
        });
      }

      // Clear draft
      clearDraft('new-spotter-draft');

      toast({
        title: 'Submission saved',
        description: 'Spotter submission has been saved successfully.',
      });

      // Redirect to Tow Driver View to see the new group with optimized routes
      navigate('/tow-driver?newSubmission=true');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save submission. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      'Client,VIN,Year,Make,Model,Color,Plate,Address,Reachable,Rusted,Location Type,Parked,Notes,Created By,Created At',
      [
        formData.client,
        formData.vin,
        formData.year,
        formData.make,
        formData.model,
        formData.color,
        formData.plate,
        formData.address,
        formData.reachable,
        formData.rusted,
        formData.locationType,
        formData.parked,
        formData.notes.join('; '),
        currentUser,
        new Date().toISOString()
      ].map(field => `"${field}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spotter-intake-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV exported',
      description: 'Current submission exported as CSV.',
    });
  };

  const handleUserChange = () => {
    setCurrentUser(tempUser);
    setShowUserDialog(false);
    toast({
      title: 'User updated',
      description: `Current spotter set to ${tempUser}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/spotters/submissions">
              <Button variant="outline" className="flex items-center gap-2 bg-gray-800/50 text-gray-300 border-gray-600 hover:bg-gray-700/50">
                <ArrowLeft className="w-4 h-4" />
                Back to Submissions
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2 bg-gray-800/50 text-gray-300 border-gray-600 hover:bg-gray-700/50">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-white">Spotter Intake</h1>
            <p className="text-gray-400 mt-1">
              Fill out vehicle information and generate AI-style summary card
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Spotter: <span className="text-white font-medium">{currentUser}</span>
              <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogTrigger asChild>
                  <button className="ml-2 text-blue-400 hover:text-blue-300 underline">
                    Change
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Current Spotter</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="spotter-name">Spotter Name</Label>
                      <Input
                        id="spotter-name"
                        value={tempUser}
                        onChange={(e) => setTempUser(e.target.value)}
                        placeholder="Enter spotter name"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUserChange}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Camera className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Vehicle Information</h2>
              </div>
              
              <SpotterForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                clients={clients}
                errors={errors}
              />
            </GlassCard>

            {/* Actions */}
            <GlassCard className="p-4 sticky bottom-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  className="flex-1 min-w-32"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="flex-1 min-w-32"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="flex-1 min-w-32 bg-blue-600 hover:bg-blue-700"
                >
                  Submit
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* Live Preview Section */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Eye className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Live Preview</h2>
              </div>
              
              {formData.photos && formData.photos.length > 0 ? (
                <SpotterCard
                  submission={{
                    id: 'preview',
                    createdBy: currentUser,
                    createdAtISO: new Date().toISOString(),
                    client: formData.client,
                    vin: formData.vin,
                    year: formData.year,
                    make: formData.make,
                    model: formData.model,
                    color: formData.color,
                    plate: formData.plate,
                    address: formData.address,
                    reachable: formData.reachable,
                    rusted: formData.rusted,
                    locationType: formData.locationType,
                    parked: formData.parked,
                    notes: formData.notes,
                    photoUrls: (() => {
                      try {
                        return formData.photos?.map(photo => 
                          photo instanceof File ? URL.createObjectURL(photo) : ''
                        ).filter(url => url) || [];
                      } catch (error) {
                        console.error('Error creating object URLs:', error);
                        return [];
                      }
                    })()
                  }}
                />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Upload a photo to see preview</p>
                  <p className="text-sm">
                    Upload a vehicle photo to generate the AI-style card preview
                  </p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSpotter;
