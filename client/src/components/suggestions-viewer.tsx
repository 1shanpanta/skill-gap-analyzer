"use client";

import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";

interface SuggestionsViewerProps {
  content: string;
  actions?: React.ReactNode;
}

export function SuggestionsViewer({ content, actions }: SuggestionsViewerProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Resume Suggestions
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
