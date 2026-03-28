"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Map, Hammer } from "lucide-react";

interface RoadmapViewerProps {
  content: string;
  actions?: React.ReactNode;
}

export function RoadmapViewer({ content, actions }: RoadmapViewerProps) {
  const { roadmap, projects } = splitRoadmapSections(content);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5 text-muted-foreground" />
              Learning Roadmap
            </CardTitle>
            {actions}
          </div>
        </CardHeader>
        <CardContent>
          <div className="markdown-content">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{roadmap}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {projects && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hammer className="h-5 w-5 text-primary" />
              Recommended Projects
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Build these to demonstrate your skills to employers
            </p>
          </CardHeader>
          <CardContent>
            <div className="markdown-content">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{projects}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function splitRoadmapSections(content: string): {
  roadmap: string;
  projects: string | null;
} {
  const projectHeaders = [
    /^###?\s*SECTION\s*2\s*:\s*Recommended\s*Projects/im,
    /^###?\s*Recommended\s*Projects/im,
    /^##\s*Recommended\s*Projects/im,
  ];

  for (const pattern of projectHeaders) {
    const match = content.match(pattern);
    if (match && match.index !== undefined) {
      const roadmap = content.slice(0, match.index).replace(/###?\s*SECTION\s*1\s*:\s*Learning\s*Roadmap\s*/i, '').trim();
      const projects = content.slice(match.index).replace(pattern, '').trim();
      return { roadmap, projects };
    }
  }

  return { roadmap: content, projects: null };
}
