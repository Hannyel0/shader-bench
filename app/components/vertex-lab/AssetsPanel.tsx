"use client";

import React, { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  X,
  Upload,
  Folder,
  FolderOpen,
  Image,
  Box,
  Layers,
  Grid3x3,
  List,
  ChevronRight,
  File,
  Palette,
  FileCode,
} from "lucide-react";
import { GLTFImporter } from "../../utils/GLTFLoader";
import { SceneObject, generateObjectId, createDefaultMaterial } from "./SceneManager";

type ViewMode = "grid" | "list";
type AssetType = "all" | "texture" | "model" | "material" | "shader";

interface AssetNode {
  id: string;
  name: string;
  type: "folder" | "texture" | "model" | "material" | "shader";
  parentId: string | null;
  expanded?: boolean;
  children?: AssetNode[];
  size?: string;
  format?: string;
  thumbnail?: string;
}

interface AssetsPanelProps {
  onAddObject?: (object: SceneObject) => void;
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({ onAddObject }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterType, setFilterType] = useState<AssetType>("all");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["textures", "models", "materials"])
  );
  const [isLoading, setIsLoading] = useState(false);

  const gltfImporter = useRef(new GLTFImporter());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock hierarchical data
  const mockAssets: AssetNode[] = [
    {
      id: "textures",
      name: "Textures",
      type: "folder",
      parentId: null,
      expanded: true,
    },
    {
      id: "tex-1",
      name: "Brick_Diffuse.png",
      type: "texture",
      parentId: "textures",
      size: "2048x2048",
      format: "PNG",
      thumbnail: "🧱",
    },
    {
      id: "tex-2",
      name: "Metal_Normal.png",
      type: "texture",
      parentId: "textures",
      size: "1024x1024",
      format: "PNG",
      thumbnail: "⚙️",
    },
    {
      id: "tex-3",
      name: "Wood_Roughness.jpg",
      type: "texture",
      parentId: "textures",
      size: "2048x2048",
      format: "JPG",
      thumbnail: "🪵",
    },
    {
      id: "models",
      name: "Models",
      type: "folder",
      parentId: null,
      expanded: true,
    },
    {
      id: "mod-1",
      name: "Rock_High.obj",
      type: "model",
      parentId: "models",
      size: "15K tris",
      format: "OBJ",
      thumbnail: "🪨",
    },
    {
      id: "mod-2",
      name: "Tree_LOD0.fbx",
      type: "model",
      parentId: "models",
      size: "8.2K tris",
      format: "FBX",
      thumbnail: "🌳",
    },
    {
      id: "materials",
      name: "Materials",
      type: "folder",
      parentId: null,
      expanded: true,
    },
    {
      id: "mat-1",
      name: "Glass_PBR.mat",
      type: "material",
      parentId: "materials",
      format: "MAT",
      thumbnail: "💎",
    },
    {
      id: "mat-2",
      name: "Concrete.mat",
      type: "material",
      parentId: "materials",
      format: "MAT",
      thumbnail: "🔲",
    },
    {
      id: "shaders",
      name: "Shaders",
      type: "folder",
      parentId: null,
      expanded: false,
    },
    {
      id: "shd-1",
      name: "Displacement.glsl",
      type: "shader",
      parentId: "shaders",
      format: "GLSL",
      thumbnail: "📝",
    },
  ];

  const assetTree = useMemo(() => {
    const tree: AssetNode[] = [];
    const map = new Map<string, AssetNode>();

    mockAssets.forEach((asset) => {
      map.set(asset.id, { ...asset, children: [] });
    });

    mockAssets.forEach((asset) => {
      const node = map.get(asset.id)!;
      if (asset.parentId === null) {
        tree.push(node);
      } else {
        const parent = map.get(asset.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      }
    });

    return tree;
  }, []);

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim() && filterType === "all") return assetTree;

    const matchesFilter = (node: AssetNode): boolean => {
      if (filterType !== "all" && node.type !== "folder" && node.type !== filterType)
        return false;
      if (searchQuery.trim() && !node.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    };

    const filterTree = (nodes: AssetNode[]): AssetNode[] => {
      const filtered: AssetNode[] = [];

      nodes.forEach((node) => {
        const filteredChildren = node.children ? filterTree(node.children) : [];
        const hasMatchingChildren = filteredChildren.length > 0;
        const matchesSelf = matchesFilter(node);

        if (matchesSelf || hasMatchingChildren) {
          filtered.push({
            ...node,
            children: filteredChildren,
          });
        }
      });

      return filtered;
    };

    return filterTree(assetTree);
  }, [assetTree, searchQuery, filterType]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Handle file import from file input
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    for (const file of Array.from(files)) {
      if (file.name.endsWith('.gltf') || file.name.endsWith('.glb')) {
        try {
          const gltfData = await gltfImporter.current.loadFromFile(file);

          // Create scene object with GLTF data (using Group type)
          const object: SceneObject = {
            id: generateObjectId(),
            name: file.name.replace(/\.(gltf|glb)$/, ''),
            type: "Group",  // GLTF models are Groups
            gltfData,
            material: createDefaultMaterial(),
            transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            visible: true,
            locked: false,
            parentId: null,
            childIds: [],
            expanded: false,
          };

          // Notify parent component
          if (onAddObject) {
            onAddObject(object);
          }

          console.log(`Model imported successfully: ${file.name}`);
        } catch (error) {
          console.error('Failed to load GLTF:', error);
          alert(`Failed to load ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        alert(`${file.name} is not a supported GLTF/GLB file`);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsLoading(false);
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    setIsLoading(true);

    for (const file of files) {
      if (file.name.endsWith('.gltf') || file.name.endsWith('.glb')) {
        try {
          const gltfData = await gltfImporter.current.loadFromFile(file);

          // Create scene object with GLTF data (using Group type)
          const object: SceneObject = {
            id: generateObjectId(),
            name: file.name.replace(/\.(gltf|glb)$/, ''),
            type: "Group",  // GLTF models are Groups
            gltfData,
            material: createDefaultMaterial(),
            transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            visible: true,
            locked: false,
            parentId: null,
            childIds: [],
            expanded: false,
          };

          // Notify parent component
          if (onAddObject) {
            onAddObject(object);
          }

          console.log(`Model imported successfully: ${file.name}`);
        } catch (error) {
          console.error('Failed to load GLTF:', error);
          alert(`Failed to load ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    setIsLoading(false);
  };

  const getAssetIcon = (type: AssetNode["type"]) => {
    switch (type) {
      case "folder":
        return <Folder className="w-3.5 h-3.5 text-amber-400" />;
      case "texture":
        return <Image className="w-3.5 h-3.5 text-blue-400" />;
      case "model":
        return <Box className="w-3.5 h-3.5 text-green-400" />;
      case "material":
        return <Palette className="w-3.5 h-3.5 text-purple-400" />;
      case "shader":
        return <FileCode className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <File className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getAssetTypeColor = (type: AssetNode["type"]) => {
    switch (type) {
      case "texture":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "model":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "material":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "shader":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      default:
        return "bg-zinc-800/50 text-zinc-400 border-zinc-700";
    }
  };

  const renderTreeNode = (node: AssetNode, depth: number = 0) => {
    const isFolder = node.type === "folder";
    const isExpanded = expandedFolders.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    if (isFolder && hasChildren) {
      return (
        <Collapsible key={node.id} open={isExpanded} onOpenChange={() => toggleFolder(node.id)}>
          <div
            className="group rounded-md border border-zinc-700/50 bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-600 transition-all"
            style={{ marginLeft: `${depth * 12}px` }}
          >
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-zinc-700">
                  <ChevronRight
                    className={`h-3 w-3 text-zinc-400 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>

              <div className="flex-1 flex items-center gap-2">
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-xs font-medium text-zinc-200 truncate">{node.name}</span>
                <Badge
                  variant="outline"
                  className="h-4 px-1 text-[9px] bg-zinc-800/50 text-zinc-400 border-zinc-700"
                >
                  {node.children!.length}
                </Badge>
              </div>
            </div>
          </div>

          <CollapsibleContent className="mt-1 space-y-1">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div
        key={node.id}
        className="group rounded-md border border-zinc-700/50 bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-600 transition-all cursor-pointer"
        style={{ marginLeft: `${depth * 12}px` }}
      >
        <div className="flex items-center gap-2 px-2 py-1.5">
          {!isFolder && <div className="w-5" />}

          {getAssetIcon(node.type)}

          <span className="flex-1 text-xs font-medium text-zinc-200 truncate">{node.name}</span>

          {!isFolder && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {node.format && (
                <Badge variant="outline" className={`h-4 px-1 text-[8px] ${getAssetTypeColor(node.type)}`}>
                  {node.format}
                </Badge>
              )}
              {node.size && <span className="text-[9px] text-zinc-500">{node.size}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGridView = (nodes: AssetNode[]) => {
    const flattenAssets = (nodeList: AssetNode[]): AssetNode[] => {
      return nodeList.reduce((acc: AssetNode[], node) => {
        if (node.type !== "folder") {
          acc.push(node);
        }
        if (node.children) {
          acc.push(...flattenAssets(node.children));
        }
        return acc;
      }, []);
    };

    const assets = flattenAssets(nodes);

    return (
      <div className="p-2 grid grid-cols-8 gap-2">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="group relative aspect-square bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600 transition-all cursor-pointer rounded-md overflow-hidden"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5">
              <div className="text-xl mb-1">{asset.thumbnail}</div>
              <span className="text-[8px] text-zinc-300 text-center truncate w-full px-1">
                {asset.name}
              </span>
              <Badge
                variant="outline"
                className={`mt-1 h-3 px-1 text-[7px] ${getAssetTypeColor(asset.type)}`}
              >
                {asset.type}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const stats = useMemo(() => {
    const countAssets = (nodes: AssetNode[]) => {
      let count = 0;
      nodes.forEach((node) => {
        if (node.type !== "folder") count++;
        if (node.children) count += countAssets(node.children);
      });
      return count;
    };
    return {
      total: countAssets(assetTree),
      filtered: countAssets(filteredTree),
    };
  }, [assetTree, filteredTree]);

  return (
    <div
      className="w-full h-full flex flex-col bg-zinc-900/50 rounded-lg border border-zinc-800"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".gltf,.glb"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#FF5C3D]/10 border border-[#FF5C3D]/20">
              <Layers className="h-3.5 w-3.5 text-[#FF5C3D]" />
            </div>
            <h3 className="font-semibold text-xs text-white">Assets</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="h-5 text-[9px] bg-zinc-800/50 text-zinc-400 border-zinc-700"
            >
              {stats.filtered}
            </Badge>

            <div className="inline-flex items-center gap-0.5 p-0.5 bg-zinc-800/50 rounded border border-zinc-700">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("grid")}
                className={`h-5 w-5 p-0 ${
                  viewMode === "grid" ? "bg-[#FF5C3D] text-white hover:bg-[#FF5C3D]/90" : "hover:bg-zinc-700 text-zinc-400"
                }`}
              >
                <Grid3x3 className="w-2.5 h-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("list")}
                className={`h-5 w-5 p-0 ${
                  viewMode === "list" ? "bg-[#FF5C3D] text-white hover:bg-[#FF5C3D]/90" : "hover:bg-zinc-700 text-zinc-400"
                }`}
              >
                <List className="w-2.5 h-2.5" />
              </Button>
            </div>

            <Button
              size="sm"
              className="h-6 px-2 text-[10px] bg-[#FF5C3D] hover:bg-[#FF5C3D]/90 text-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="w-3 h-3 mr-1" />
              {isLoading ? "Loading..." : "Import GLTF"}
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-8 pr-8 text-xs bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#FF5C3D]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-zinc-700 rounded p-0.5"
              >
                <X className="w-3 h-3 text-zinc-500" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 text-zinc-400"
              >
                <Layers className="w-3 h-3 mr-1" />
                {filterType === "all" ? "All" : filterType}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-zinc-900 border-zinc-800">
              <DropdownMenuItem
                onClick={() => setFilterType("all")}
                className="text-zinc-300 hover:bg-zinc-800 text-xs"
              >
                <Layers className="w-3 h-3 mr-2" />
                All
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={() => setFilterType("texture")}
                className="text-zinc-300 hover:bg-zinc-800 text-xs"
              >
                <Image className="w-3 h-3 mr-2 text-blue-400" />
                Textures
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterType("model")}
                className="text-zinc-300 hover:bg-zinc-800 text-xs"
              >
                <Box className="w-3 h-3 mr-2 text-green-400" />
                Models
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterType("material")}
                className="text-zinc-300 hover:bg-zinc-800 text-xs"
              >
                <Palette className="w-3 h-3 mr-2 text-purple-400" />
                Materials
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterType("shader")}
                className="text-zinc-300 hover:bg-zinc-800 text-xs"
              >
                <FileCode className="w-3 h-3 mr-2 text-orange-400" />
                Shaders
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Assets View */}
      <ScrollArea className="flex-1 min-h-0">
        {viewMode === "list" ? (
          <div className="p-2 space-y-1">
            {filteredTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center text-zinc-500 text-xs">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <span>No assets found</span>
                <span className="text-[10px] mt-1 text-zinc-600">
                  {searchQuery ? `No matches for "${searchQuery}"` : 'Click "Import" to add assets'}
                </span>
              </div>
            ) : (
              filteredTree.map((node) => renderTreeNode(node))
            )}
          </div>
        ) : (
          renderGridView(filteredTree)
        )}
      </ScrollArea>
    </div>
  );
};
