import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Trash2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  resource_type: string;
  file_type: string | null;
  file_url: string | null;
  storage_path: string | null;
  file_size: number | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  subject: string | null;
  level: string | null;
  stage: string | null;
  uploaded_by: string | null;
  is_public: boolean | null;
  download_count: number | null;
  created_at: string;
}

interface ResourceLibraryProps {
  onSelectResource?: (resource: Resource) => void;
  selectedType?: string;
  compact?: boolean;
}

export const ResourceLibrary = ({ onSelectResource, selectedType, compact = false }: ResourceLibraryProps) => {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(selectedType || 'all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [searchTerm, typeFilter, levelFilter, stageFilter, resources]);

  useEffect(() => {
    if (selectedType) {
      setTypeFilter(selectedType);
    }
  }, [selectedType]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      // Note: resources table doesn't exist yet in database
      // This is a placeholder for when it's implemented
      setResources([]);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = [...resources];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((r) => r.resource_type === typeFilter);
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter((r) => r.level === levelFilter);
    }

    // Stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter((r) => r.stage === stageFilter);
    }

    setFilteredResources(filtered);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter(selectedType || 'all');
    setLevelFilter('all');
    setStageFilter('all');
  };

  const getResourceIcon = (type: string | null) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'link':
        return '🔗';
      default:
        return '📁';
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'warmup':
        return 'bg-accent-pink/20 text-accent-pink';
      case 'main_activity':
        return 'bg-primary/20 text-primary';
      case 'assessment':
        return 'bg-accent-orange/20 text-accent-orange';
      case 'homework':
        return 'bg-accent-teal/20 text-accent-teal';
      case 'printable':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${compact ? 'h-full flex flex-col' : ''}`}>
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="warmup">Warm-up</SelectItem>
              <SelectItem value="main_activity">Main Activity</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
              <SelectItem value="homework">Homework</SelectItem>
              <SelectItem value="printable">Printable</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Pre-A1">Pre-A1</SelectItem>
              <SelectItem value="A1">A1</SelectItem>
              <SelectItem value="A2">A2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="Stage 1">Stage 1</SelectItem>
              <SelectItem value="Stage 2">Stage 2</SelectItem>
              <SelectItem value="Stage 3">Stage 3</SelectItem>
              <SelectItem value="Stage 4">Stage 4</SelectItem>
              <SelectItem value="Stage 5">Stage 5</SelectItem>
              <SelectItem value="Stage 6">Stage 6</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleResetFilters} className="gap-2">
            <Filter size={16} />
            Reset
          </Button>
        </div>
      </div>

      {/* Resources List */}
      <div className={`${compact ? 'flex-1 overflow-y-auto' : ''} space-y-2`}>
        {filteredResources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No resources found. Try adjusting your filters.
          </div>
        ) : (
          filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer bg-background"
              onClick={() => onSelectResource?.(resource)}
              draggable={!!onSelectResource}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(resource));
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{getResourceIcon(resource.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{resource.name}</h4>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={getResourceTypeColor(resource.resource_type)}>
                      {resource.resource_type.replace('_', ' ')}
                    </Badge>
                    {resource.level && <Badge variant="outline">{resource.level}</Badge>}
                    {resource.stage && <Badge variant="outline">{resource.stage}</Badge>}
                    {resource.file_size && (
                      <Badge variant="secondary">{formatFileSize(resource.file_size)}</Badge>
                    )}
                  </div>
                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {resource.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {resource.file_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(resource.file_url!, '_blank');
                      }}
                    >
                      <Eye size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
