import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { TextInput } from "@/components/TextInput";
import { SummaryDisplay } from "@/components/SummaryDisplay";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [textContent, setTextContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (content: string, name: string) => {
    setTextContent(content);
    setFileName(name);
    toast({
      title: "File loaded!",
      description: `${name} is ready to be summarized`,
    });
  };

  const handleSummarize = async () => {
    if (!textContent.trim()) {
      toast({
        title: "No content",
        description: "Please upload a file or paste some text first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setSummary("");
    setKeyPoints([]);

    try {
      const { data, error } = await supabase.functions.invoke("summarize-text", {
        body: { text: textContent },
      });

      if (error) throw error;

      setSummary(data.summary);
      setKeyPoints(data.keyPoints);
      
      toast({
        title: "Success!",
        description: "Your content has been summarized",
      });
    } catch (error) {
      console.error("Summarization error:", error);
      toast({
        title: "Error",
        description: "Failed to summarize content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-accent">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              AI Note Summarizer
            </h1>
            <p className="text-xl text-primary-foreground/90 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Transform lengthy documents into concise summaries and key insights in seconds
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Upload or Paste</h2>
            </div>
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <TextInput
              value={textContent}
              onChange={setTextContent}
              disabled={isProcessing}
            />
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleSummarize}
              disabled={isProcessing || !textContent.trim()}
              className="min-w-[200px] bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Summarize
                </>
              )}
            </Button>
          </div>

          {/* Summary Display */}
          {summary && (
            <SummaryDisplay
              summary={summary}
              keyPoints={keyPoints}
              fileName={fileName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
