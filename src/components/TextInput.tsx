import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TextInput = ({ 
  value, 
  onChange, 
  placeholder = "Paste your notes or text here...",
  disabled = false 
}: TextInputProps) => {
  return (
    <Card className="p-4">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[200px] resize-none border-0 focus-visible:ring-0 text-base"
        disabled={disabled}
      />
    </Card>
  );
};
