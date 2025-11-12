import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (content: string, fileName: string) => void;
  isProcessing: boolean;
}

export const FileUpload = ({ onFileSelect, isProcessing }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = async (file: File) => {
    if (file.type === "application/pdf") {
      // For PDF files, we'll use a simple extraction
      // In production, you'd use a proper PDF parser
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        onFileSelect(text, file.name);
      };
      reader.readAsText(file);
    } else if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileSelect(text, file.name);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or TXT file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        setSelectedFile(file);
        processFile(file);
      }
    },
    [onFileSelect, toast]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      processFile(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card
      className={`relative border-2 border-dashed transition-all duration-300 ${
        dragActive
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="p-8 text-center">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.txt"
          onChange={handleChange}
          disabled={isProcessing}
        />
        
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-foreground">
              <FileText className="h-8 w-8 text-primary" />
              <span className="font-medium">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Drop your file here
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse (PDF or TXT)
            </p>
            <label htmlFor="file-upload">
              <Button variant="default" className="cursor-pointer" asChild>
                <span>Choose File</span>
              </Button>
            </label>
          </>
        )}
      </div>
    </Card>
  );
};
