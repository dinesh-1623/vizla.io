import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppShell from '@/components/shell/AppShell';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpotterForm } from '@/components/spotter/SpotterForm';
import { SpotterCard } from '@/components/spotter/SpotterCard';
import { SpotterMap } from '@/components/spotter/SpotterMap';
import { useSpotterStore } from '@/lib/store/spotterStore';
import { SpotterFormData, SpotterSubmission } from '@/lib/types/spotter';
import { useToast } from '@/hooks/use-toast';
import { Eye, Camera, Download, Save, ArrowLeft, Home, MapPin } from 'lucide-react';

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
  const [submittedSubmission, setSubmittedSubmission] = useState<SpotterSubmission | null>(null);
  const [showMap, setShowMap] = useState(false);

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

  // Convert file to base64 data URL
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Validate critical fields
    if (!formData.client || !formData.vin || !formData.address) {
      toast({
        title: "Validation Error",
        description: "Please ensure Client, VIN, and Address are filled.",
        variant: "destructive"
      });
      return;
    }

    // Convert all photos to base64 data URLs
    const photoUrls: string[] = [];
    if (formData.photos && formData.photos.length > 0) {
      try {
        for (const photo of formData.photos) {
          if (photo instanceof File) {
            // Check file size before processing (limit to 2MB per image)
            const maxFileSize = 2 * 1024 * 1024; // 2MB
            if (photo.size > maxFileSize) {
              console.warn(`⚠️ Photo ${photo.name} is ${(photo.size / 1024 / 1024).toFixed(2)}MB, larger than 2MB limit`);
              toast({
                title: "Image Too Large",
                description: `Image "${photo.name}" is too large. Please use images under 2MB.`,
                variant: "destructive"
              });
              return;
            }
            
            const dataUrl = await fileToDataURL(photo);
            
            // Check if data URL is too large (sanity check)
            if (dataUrl.length > 3 * 1024 * 1024) { // 3MB limit for base64
              console.warn(`⚠️ Converted data URL is too large: ${(dataUrl.length / 1024 / 1024).toFixed(2)}MB`);
              toast({
                title: "Image Processing Error",
                description: `Image "${photo.name}" resulted in data that's too large. Please use a smaller image.`,
                variant: "destructive"
              });
              return;
            }
            
            photoUrls.push(dataUrl);
            console.log(`✅ Converted photo ${photo.name}, size: ${(dataUrl.length / 1024).toFixed(2)}KB`);
          } else if (typeof photo === 'string') {
            // Already a data URL - validate it's not too large
            if (photo.length > 3 * 1024 * 1024) {
              console.warn('⚠️ Existing data URL is too large, skipping');
              continue;
            }
            photoUrls.push(photo);
          }
        }
        
        const totalPhotoSize = photoUrls.reduce((sum, url) => sum + url.length, 0);
        console.log(`📸 Total photos: ${photoUrls.length}, Total size: ${(totalPhotoSize / 1024 / 1024).toFixed(2)}MB`);
        
      } catch (error: any) {
        console.error('❌ Error converting photos to data URLs:', error);
        toast({
          title: "Error",
          description: `Failed to process images: ${error?.message || 'Unknown error'}. Please try again.`,
          variant: "destructive"
        });
        return;
      }
    }

    // Generate UUID with fallback
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback UUID generator
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Create submission object with validation
    const submission: SpotterSubmission = {
      id: generateUUID(),
      createdBy: currentUser || 'Unknown Spotter',
      createdAtISO: new Date().toISOString(),
      client: formData.client.trim(),
      vin: formData.vin.trim(),
      year: formData.year || 0,
      make: formData.make.trim(),
      model: formData.model.trim(),
      color: formData.color.trim(),
      plate: formData.plate.trim(),
      address: formData.address.trim(),
      reachable: formData.reachable || 'Reachable',
      rusted: formData.rusted || 'Not rusted',
      locationType: formData.locationType || 'Single Family Home',
      parked: formData.parked || 'Pulled in',
      notes: Array.isArray(formData.notes) ? formData.notes : [],
      photoUrls: photoUrls
    };

    // Validate submission object
    if (!submission.id || !submission.client || !submission.vin || !submission.address) {
      console.error('Invalid submission data:', submission);
      toast({
        title: "Validation Error",
        description: "Submission data is incomplete. Please check all fields.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 Attempting to save submission:', {
      id: submission.id,
      client: submission.client,
      vin: submission.vin,
      photoCount: photoUrls.length
    });

    // Test if submission can be stringified (catch circular references, etc.)
    try {
      const testString = JSON.stringify(submission);
      console.log('✅ Submission can be stringified, length:', testString.length);
    } catch (stringifyError: any) {
      console.error('❌ Cannot stringify submission:', stringifyError);
      toast({
        title: 'Data Error',
        description: 'Submission data contains invalid content. Please check all fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if localStorage is available
      if (typeof Storage === 'undefined') {
        throw new Error('localStorage is not available in this browser');
      }

      if (!window.localStorage) {
        throw new Error('window.localStorage is not available');
      }

      // Load existing submissions with better error handling
      let submissions: SpotterSubmission[] = [];
      try {
        const existingData = localStorage.getItem('spotter-submissions');
        if (existingData) {
          console.log('📦 Loading existing submissions, data length:', existingData.length);
          submissions = JSON.parse(existingData);
          if (!Array.isArray(submissions)) {
            console.warn('⚠️ Existing data is not an array, resetting:', submissions);
            submissions = [];
          }
        } else {
          console.log('📦 No existing submissions found');
        }
      } catch (parseError: any) {
        console.error('❌ Error parsing existing submissions:', parseError);
        // If parsing fails, start fresh but preserve the key
        submissions = [];
        // Try to clear corrupted data
        try {
          localStorage.removeItem('spotter-submissions');
        } catch (clearError) {
          console.error('Failed to clear corrupted data:', clearError);
        }
      }

      // Add new submission to the beginning
      submissions.unshift(submission);
      console.log(`✅ Added submission. Total submissions: ${submissions.length}`);

      // Try to save to localStorage with error handling
      try {
        console.log('💾 Attempting to stringify submissions...');
        const dataToSave = JSON.stringify(submissions);
        console.log('✅ Stringify successful, data length:', dataToSave.length);
        
        const dataSize = new Blob([dataToSave]).size;
        const maxSize = 5 * 1024 * 1024; // 5MB limit (typical localStorage limit is ~5-10MB)
        console.log(`📊 Data size: ${(dataSize / 1024 / 1024).toFixed(2)}MB / ${(maxSize / 1024 / 1024).toFixed(2)}MB`);

        if (dataSize > maxSize) {
          console.log('⚠️ Data too large, trimming old photos...');
          // If data is too large, try to compress by removing old photo data URLs
          // Keep only the most recent 20 submissions with full photos
          const trimmedSubmissions = submissions.slice(0, 20).map((sub, index) => {
            if (index > 0) {
              // Keep photos only for the newest submission
              return { ...sub, photoUrls: [] };
            }
            return sub;
          });

          const trimmedData = JSON.stringify(trimmedSubmissions);
          console.log('💾 Saving trimmed data...');
          localStorage.setItem('spotter-submissions', trimmedData);
          console.log('✅ Trimmed data saved successfully');

          toast({
            title: 'Submission saved',
            description: 'Saved (older photo data was removed to save space).',
          });
        } else {
          console.log('💾 Saving full data to localStorage...');
          localStorage.setItem('spotter-submissions', dataToSave);
          console.log('✅ Data saved successfully');
        }
      } catch (storageError: any) {
        console.error('❌ Storage error details:', {
          name: storageError?.name,
          message: storageError?.message,
          code: storageError?.code,
          error: storageError
        });

        // Handle quota exceeded error specifically
        if (storageError?.name === 'QuotaExceededError' || storageError?.code === 22) {
          console.error('localStorage quota exceeded:', storageError);
          
          // Try saving without photos for older submissions
          const trimmedSubmissions = submissions.map((sub, index) => {
            if (index > 10) {
              return { ...sub, photoUrls: [] };
            }
            return sub;
          });

          try {
            console.log('🔄 Retrying with trimmed photos...');
            const trimmedData = JSON.stringify(trimmedSubmissions);
            localStorage.setItem('spotter-submissions', trimmedData);
            console.log('✅ Retry successful');
            
            toast({
              title: 'Storage limit reached',
              description: 'Submission saved, but older photo data was removed to free up space.',
              variant: 'default',
            });
          } catch (retryError: any) {
            console.error('❌ Retry also failed:', retryError);
            throw new Error(`Storage quota exceeded. Tried to save ${submissions.length} submissions. Please clear browser data or contact support.`);
          }
        } else {
          // For other errors, log details and rethrow
          console.error('❌ Unexpected storage error:', storageError);
          throw new Error(`Failed to save to localStorage: ${storageError?.message || 'Unknown error'}`);
        }
      }

      // In development, also append to JSON file (but don't fail if this errors)
      if (import.meta.env.DEV) {
        fetch('/api/spotter-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission)
        }).catch((fetchError) => {
          // Ignore API errors - this is optional in dev mode
          console.warn('Failed to save to API (optional):', fetchError);
        });
      }

      // Clear draft
      try {
        clearDraft('new-spotter-draft');
      } catch (draftError) {
        console.warn('Failed to clear draft:', draftError);
        // Non-critical, continue
      }

      // Dispatch custom event to notify other components
      try {
        window.dispatchEvent(new CustomEvent('spotterSubmissionAdded', {
          detail: { submission }
        }));
      } catch (eventError) {
        console.warn('Failed to dispatch event:', eventError);
        // Non-critical, continue
      }

      // Show success toast (if not already shown)
      toast({
        title: 'Submission saved',
        description: 'Spotter submission has been saved successfully.',
      });

      // Set submitted submission to show map
      setSubmittedSubmission(submission);
      setShowMap(true);

      // Scroll to map section
      setTimeout(() => {
        const mapElement = document.getElementById('submission-map');
        if (mapElement) {
          mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error: any) {
      console.error('❌ Fatal error saving spotter submission:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        toString: error?.toString()
      });
      
      // Provide more detailed error message
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      
      // Check if it's a specific type of error
      let userMessage = `Failed to save submission: ${errorMessage}`;
      
      if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceeded')) {
        userMessage = 'Storage limit reached. Please clear browser data or contact support.';
      } else if (errorMessage.includes('localStorage')) {
        userMessage = 'Browser storage is not available. Please check your browser settings.';
      } else if (errorMessage.includes('JSON')) {
        userMessage = 'Data format error. Please refresh the page and try again.';
      }
      
      toast({
        title: 'Error',
        description: userMessage,
        variant: 'destructive',
      });
      
      // Also log to console for debugging
      console.error('📋 Full error context:', {
        submissionId: submission?.id,
        submissionClient: submission?.client,
        photoCount: photoUrls?.length,
        error
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
    <AppShell title="Spotter Intake">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/spotters/submissions">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Submissions
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-vizla-text-primary">Spotter Intake</h1>
            <p className="text-vizla-text-secondary mt-1">
              Fill out vehicle information and generate AI-style summary card
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-vizla-text-secondary">
              Spotter: <span className="text-vizla-text-primary font-medium">{currentUser}</span>
              <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogTrigger asChild>
                  <button className="ml-2 text-vizla-brand-primary hover:text-vizla-brand-primary/80 underline">
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
                <Camera className="w-5 h-5 text-vizla-brand-primary" />
                <h2 className="text-xl font-semibold text-vizla-text-primary">Vehicle Information</h2>
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
                  className="flex-1 min-w-32 bg-vizla-brand-primary hover:bg-vizla-brand-primary/90 disabled:bg-vizla-glassElev disabled:cursor-not-allowed"
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
                <h2 className="text-xl font-semibold text-vizla-text-primary">Live Preview</h2>
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
                        // For live preview, we'll use object URLs for immediate display
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

            {/* Map Preview - Shows location as user types address */}
            {formData.address && (
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-vizla-brand-primary" />
                  <h2 className="text-lg font-semibold text-vizla-text-primary">Location Preview</h2>
                </div>
                <p className="text-xs text-vizla-text-secondary mb-4">
                  Preview the location on the map (same as Operations Map)
                </p>
                <SpotterMap 
                  address={formData.address}
                  className="w-full"
                />
              </GlassCard>
            )}
          </div>
        </div>

        {/* Map Section - Shows after submission */}
        {showMap && submittedSubmission && (
          <div id="submission-map" className="space-y-6 mt-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-vizla-brand-primary" />
                <h2 className="text-xl font-semibold text-vizla-text-primary">Vehicle Location on Map</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-vizla-text-secondary">
                  The submitted vehicle location has been plotted on the map below. This matches the same map plotting used in the Operations Map page.
                </p>
                
                <SpotterMap 
                  submission={submittedSubmission}
                  className="w-full"
                />
                
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowMap(false);
                      setSubmittedSubmission(null);
                      // Reset form
                      setFormData({
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
                      clearDraft('new-spotter-draft');
                    }}
                    variant="outline"
                  >
                    Submit Another
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/app/spotters/submissions')}
                    className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
                  >
                    View All Submissions
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default NewSpotter;
