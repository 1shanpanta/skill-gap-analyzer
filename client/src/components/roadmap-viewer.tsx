"use client";

import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Map } from "lucide-react";

interface RoadmapViewerProps {
  content: string;
  actions?: React.ReactNode;
}

export function RoadmapViewer({ content, actions }: RoadmapViewerProps) {
  return (
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
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
