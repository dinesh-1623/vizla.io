import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SpotterCard } from '@/components/spotter/SpotterCard';
import { SpotterSubmission } from '@/lib/types/spotter';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Download, Trash2, Eye, Calendar, User, MapPin } from 'lucide-react';

const Submissions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SpotterSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SpotterSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<SpotterSubmission | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCardModal, setShowCardModal] = useState(false);

  // Load submissions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('spotter-submissions');
    if (stored) {
      const parsed = JSON.parse(stored);
      setSubmissions(parsed);
      setFilteredSubmissions(parsed);
    }
  }, []);

  // Filter submissions based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSubmissions(submissions);
    } else {
      const filtered = submissions.filter(submission =>
        submission.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubmissions(filtered);
    }
  }, [searchTerm, submissions]);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewCard = (submission: SpotterSubmission) => {
    setSelectedSubmission(submission);
    setShowCardModal(true);
  };

  const handleSelectSubmission = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredSubmissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubmissions.map(s => s.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    const updated = submissions.filter(s => !selectedIds.has(s.id));
    setSubmissions(updated);
    localStorage.setItem('spotter-submissions', JSON.stringify(updated));
    setSelectedIds(new Set());

    toast({
      title: 'Submissions deleted',
      description: `${selectedIds.size} submission(s) have been deleted.`,
    });
  };

  const handleExportSelected = () => {
    if (selectedIds.size === 0) return;

    const selectedSubmissions = submissions.filter(s => selectedIds.has(s.id));
    
    const csvContent = [
      'Client,VIN,Year,Make,Model,Color,Plate,Address,Reachable,Rusted,Location Type,Parked,Notes,Created By,Created At',
      ...selectedSubmissions.map(submission => [
        submission.client,
        submission.vin,
        submission.year,
        submission.make,
        submission.model,
        submission.color,
        submission.plate,
        submission.address,
        submission.reachable,
        submission.rusted,
        submission.locationType,
        submission.parked,
        submission.notes.join('; '),
        submission.createdBy,
        submission.createdAtISO
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spotter-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV exported',
      description: `${selectedIds.size} submission(s) exported as CSV.`,
    });
  };

  const handleExportAll = () => {
    const csvContent = [
      'Client,VIN,Year,Make,Model,Color,Plate,Address,Reachable,Rusted,Location Type,Parked,Notes,Created By,Created At',
      ...submissions.map(submission => [
        submission.client,
        submission.vin,
        submission.year,
        submission.make,
        submission.model,
        submission.color,
        submission.plate,
        submission.address,
        submission.reachable,
        submission.rusted,
        submission.locationType,
        submission.parked,
        submission.notes.join('; '),
        submission.createdBy,
        submission.createdAtISO
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-spotter-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV exported',
      description: `All ${submissions.length} submissions exported as CSV.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Spotter Submissions</h1>
            <p className="text-gray-400 mt-1">
              View and manage vehicle spotter submissions
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/spotters/new')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Submission
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{submissions.length}</p>
                <p className="text-sm text-gray-400">Total Submissions</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {new Set(submissions.map(s => s.createdBy)).size}
                </p>
                <p className="text-sm text-gray-400">Unique Spotters</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {submissions.filter(s => s.reachable === 'Reachable').length}
                </p>
                <p className="text-sm text-gray-400">Reachable Vehicles</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {submissions.filter(s => s.rusted === 'Rusted').length}
                </p>
                <p className="text-sm text-gray-400">Rusted Vehicles</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExportAll}
              variant="outline"
              disabled={submissions.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
            
            {selectedIds.size > 0 && (
              <>
                <Button
                  onClick={handleExportSelected}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected ({selectedIds.size})
                </Button>
                
                <Button
                  onClick={handleDeleteSelected}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Submissions Table */}
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date/Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Spotter</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Plate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Reachable</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Rusted</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Address</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-gray-800/30 cursor-pointer"
                    onClick={() => handleViewCard(submission)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(submission.id)}
                        onChange={() => handleSelectSubmission(submission.id)}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {formatDate(submission.createdAtISO)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {submission.createdBy}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {submission.client}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {submission.year} {submission.make} {submission.model}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                      {submission.plate}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        submission.reachable === 'Reachable'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {submission.reachable}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        submission.rusted === 'Not rusted'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {submission.rusted}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                      {submission.address}
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCard(submission)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No submissions found</p>
                <p className="text-sm">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first spotter submission'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => navigate('/spotters/new')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Submission
                  </Button>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Card Modal */}
        <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Spotter Submission Card</DialogTitle>
            </DialogHeader>
            {selectedSubmission && (
              <SpotterCard submission={selectedSubmission} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Submissions;
