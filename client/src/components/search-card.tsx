import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Copy, Check, AlertCircle, Phone, Mail, CreditCard, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchCardProps {
  type: "mobile" | "email" | "id" | "alt";
  title: string;
  description: string;
  placeholder: string;
}

const iconMap = {
  mobile: Phone,
  email: Mail,
  id: CreditCard,
  alt: Smartphone,
};

export function SearchCard({ type, title, description, placeholder }: SearchCardProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const Icon = iconMap[type];

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/search/${type}?query=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data.data);
        if (!data.data || (Array.isArray(data.data) && data.data.length === 0)) {
          toast({
            title: "No Results",
            description: "No data found for your search query.",
          });
        }
      } else {
        setError(data.error || "Search failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({
      title: "Copied",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const renderResultValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === "") return null;
    
    const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
    const fieldId = `${key}-${displayValue}`;

    return (
      <div key={key} className="flex items-start justify-between gap-2 py-2 border-b border-border last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{key.replace(/_/g, " ")}</p>
          <p className="text-sm font-mono break-all mt-0.5" data-testid={`text-result-${key}`}>{displayValue}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => copyToClipboard(displayValue, key)}
          data-testid={`button-copy-${key}`}
        >
          {copiedField === fieldId ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            data-testid={`input-search-${type}`}
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            data-testid={`button-search-${type}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="rounded-md border border-border bg-card p-3" data-testid={`result-container-${type}`}>
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary" className="text-xs">
                Results Found
              </Badge>
            </div>
            <div className="space-y-1">
              {typeof result === "object" && !Array.isArray(result) ? (
                Object.entries(result).map(([key, value]) => renderResultValue(key, value))
              ) : Array.isArray(result) ? (
                result.length > 0 ? (
                  result.map((item, idx) => (
                    <div key={idx} className="border-b border-border last:border-0 pb-2 last:pb-0 mb-2 last:mb-0">
                      {typeof item === "object" ? (
                        Object.entries(item).map(([key, value]) => renderResultValue(key, value))
                      ) : (
                        <p className="text-sm font-mono">{String(item)}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No results found</p>
                )
              ) : (
                <p className="text-sm font-mono">{String(result)}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
