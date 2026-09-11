'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download,
  FileText,
  Image,
  Video,
  Search,
  ExternalLink,
  Layers,
  FolderOpen,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  category?: string;
  downloads: number;
  createdAt: string;
  programName?: string;
  isProgramAsset?: boolean;
}

const typeIcons: Record<string, React.ElementType> = {
  BANNER: Image,
  LOGO: Image,
  SOCIAL_POST: Image,
  EMAIL_TEMPLATE: FileText,
  DOCUMENT: FileText,
  VIDEO: Video,
  DRIVE: FolderOpen,
  IMAGE: Image,
  FILE: FileText,
  OTHER: Layers,
};

const typeColors: Record<string, string> = {
  BANNER: 'bg-blue-100 text-blue-700',
  LOGO: 'bg-purple-100 text-purple-700',
  SOCIAL_POST: 'bg-pink-100 text-pink-700',
  EMAIL_TEMPLATE: 'bg-amber-100 text-amber-700',
  DOCUMENT: 'bg-slate-100 text-slate-700',
  VIDEO: 'bg-red-100 text-red-700',
  DRIVE: 'bg-green-100 text-green-700',
  IMAGE: 'bg-blue-100 text-blue-700',
  FILE: 'bg-slate-100 text-slate-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

interface ResourcesSectionProps {
  title?: string;
  description?: string;
  showHeader?: boolean;
  compact?: boolean;
  programAssets?: Resource[];
}

export function ResourcesSection({
  title = 'Tài nguyên',
  description = 'Tải tài liệu tiếp thị, banner và nội dung quảng bá',
  showHeader = true,
  compact = false,
  programAssets,
}: ResourcesSectionProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (programAssets) {
      setLoading(false);
      return;
    }
    fetchResources();
  }, [programAssets]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/affiliate/resources');
      const data = await res.json();
      if (data.success) setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    if (!resource.isProgramAsset) {
      try {
        await fetch(`/api/affiliate/resources?id=${resource.id}`, { method: 'POST' });
      } catch (_e) { /* ignore tracking errors */ }

      setResources((prev) =>
        prev.map((r) => (r.id === resource.id ? { ...r, downloads: r.downloads + 1 } : r))
      );
    }

    window.open(resource.fileUrl, '_blank');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const displayResources = programAssets ?? resources;
  const filteredResources = displayResources.filter((r) =>
    !searchQuery ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.programName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={compact ? 'space-y-4' : 'space-y-6'}>
        {showHeader && <Skeleton className="h-8 w-48" />}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {showHeader && (
        <div>
          <h1 className={compact ? 'text-xl font-bold tracking-tight' : 'text-2xl font-bold tracking-tight'}>{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm tài nguyên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Không tìm thấy tài nguyên</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {displayResources.length === 0
                ? 'Tài nguyên chiến dịch sẽ xuất hiện sau khi quản trị viên thêm vào chương trình'
                : 'Hãy thử điều chỉnh tìm kiếm hoặc bộ lọc'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const Icon = typeIcons[resource.type] || Layers;
            const colorClass = typeColors[resource.type] || 'bg-gray-100 text-gray-700';
            return (
              <Card key={resource.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="text-base mt-3">{resource.title}</CardTitle>
                  {resource.programName && <p className="mt-2 text-xs font-medium text-primary">{resource.programName}</p>}
                  {resource.description && (
                    <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="truncate">{resource.fileName}</span>
                    <span>{formatFileSize(resource.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {resource.isProgramAsset ? 'Tài nguyên chiến dịch' : `${resource.downloads} lượt tải`}
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(resource.fileUrl, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Mở link
                      </Button>
                      <Button size="sm" onClick={() => handleDownload(resource)}>
                        <Download className="h-3.5 w-3.5 mr-1" />
                        {resource.type === 'DRIVE' ? 'Mở Drive' : 'Tải xuống'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
