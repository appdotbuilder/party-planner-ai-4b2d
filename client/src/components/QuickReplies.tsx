
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface QuickRepliesProps {
  options: string[];
  onSelect: (option: string) => void;
}

export function QuickReplies({ options, onSelect }: QuickRepliesProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelectedOption(option);
    setTimeout(() => {
      onSelect(option);
      setSelectedOption(null);
    }, 150);
  };

  if (options.length === 0) return null;

  return (
    <div className="space-y-2 animate-fadeIn">
      <p className="text-xs text-gray-500 font-medium px-2">Quick replies:</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleSelect(option)}
            disabled={selectedOption !== null}
            className={`
              text-sm font-medium border-gray-200 hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 
              transition-all duration-200 rounded-full px-4 py-2 h-auto
              active:scale-95 touch-manipulation
              ${selectedOption === option ? 'bg-blue-900 text-white border-blue-900 scale-95' : ''}
            `}
          >
            <span>{option}</span>
            <ChevronRight className="w-3 h-3 ml-1 opacity-60" />
          </Button>
        ))}
      </div>
    </div>
  );
}
