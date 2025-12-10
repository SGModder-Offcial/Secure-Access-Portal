import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Phone,
  Mail,
  CreditCard,
  Smartphone,
  Search,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  User,
  MapPin,
  Hash,
  Wifi,
  Car,
  FileWarning,
  Calendar,
  Fuel,
  Building,
  CircleDollarSign,
} from "lucide-react";

interface SearchResultItem {
  address?: string;
  circle?: string;
  fname?: string;
  mobile?: string;
  name?: string;
  id?: string;
  alt?: string;
  email?: string;
  [key: string]: string | undefined;
}

const fieldLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  name: { label: "Name", icon: <User className="w-3.5 h-3.5" /> },
  fname: { label: "Father's Name", icon: <User className="w-3.5 h-3.5" /> },
  mobile: { label: "Mobile", icon: <Phone className="w-3.5 h-3.5" /> },
  alt: { label: "Alt Mobile", icon: <Smartphone className="w-3.5 h-3.5" /> },
  email: { label: "Email", icon: <Mail className="w-3.5 h-3.5" /> },
  address: { label: "Address", icon: <MapPin className="w-3.5 h-3.5" /> },
  circle: { label: "Circle", icon: <Wifi className="w-3.5 h-3.5" /> },
  id: { label: "ID", icon: <CreditCard className="w-3.5 h-3.5" /> },
};

function getIdLabel(idValue: string): string {
  if (!idValue) return "ID";
  const onlyNumbers = /^\d+$/.test(idValue.trim());
  return onlyNumbers ? "Aadhar" : "PAN Card";
}

const fieldOrder = ["name", "fname", "mobile", "alt", "email", "id", "circle", "address"];

function formatAddress(addr: string): string {
  if (!addr) return "";
  return addr
    .replace(/^!+/, "")
    .replace(/!+/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*$/g, "")
    .replace(/^\s*,\s*/g, "")
    .trim();
}

function ResultCard({ result, index }: { result: SearchResultItem; index: number }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({ title: "Copied!", description: `${field} copied to clipboard` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const sortedFields = fieldOrder.filter(
    (key) => result[key] && result[key] !== ""
  );
  
  const otherFields = Object.keys(result).filter(
    (key) => !fieldOrder.includes(key) && result[key] && result[key] !== ""
  );

  const allFields = [...sortedFields, ...otherFields];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs font-medium">
            Result {index + 1}
          </Badge>
          {result.name && (
            <span className="text-sm font-medium truncate">{result.name}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {allFields.map((key) => {
            const value = result[key];
            if (!value) return null;

            let fieldInfo = fieldLabels[key] || { label: key.toUpperCase(), icon: <Hash className="w-3.5 h-3.5" /> };
            if (key === "id") {
              fieldInfo = { ...fieldInfo, label: getIdLabel(value) };
            }
            const displayValue = key === "address" ? formatAddress(value) : value;
            const fieldId = `${key}-${index}`;

            return (
              <div
                key={key}
                className="flex items-start gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                  {fieldInfo.icon}
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {fieldInfo.label}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono break-all" data-testid={`text-result-${key}-${index}`}>
                    {displayValue}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-7 w-7"
                  onClick={() => copyToClipboard(displayValue, fieldInfo.label)}
                  data-testid={`button-copy-${key}-${index}`}
                >
                  {copiedField === fieldId ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

type ServiceType = "mobile" | "email" | "aadhar" | "pan" | "vehicle-info" | "vehicle-challan";

function VehicleResultDisplay({ data, type }: { data: any; type: "vehicle-info" | "vehicle-challan" }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({ title: "Copied!", description: `${field} copied to clipboard` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (type === "vehicle-info") {
    const vehicleInfo = data.vehicle?.data || {};
    
    if (!vehicleInfo || Object.keys(vehicleInfo).length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No vehicle information found</p>
          </CardContent>
        </Card>
      );
    }

    const vehicleFields = [
      { key: "asset_number", label: "Vehicle Number", icon: <Car className="w-3.5 h-3.5" /> },
      { key: "make_model", label: "Make & Model", icon: <Car className="w-3.5 h-3.5" /> },
      { key: "owner_name", label: "Owner Name", icon: <User className="w-3.5 h-3.5" /> },
      { key: "fuel_type", label: "Fuel Type", icon: <Fuel className="w-3.5 h-3.5" /> },
      { key: "vehicle_type", label: "Vehicle Type", icon: <Car className="w-3.5 h-3.5" /> },
      { key: "registration_date", label: "Registration Date", icon: <Calendar className="w-3.5 h-3.5" /> },
      { key: "registration_address", label: "RTO Address", icon: <Building className="w-3.5 h-3.5" /> },
      { key: "permanent_address", label: "Owner Address", icon: <MapPin className="w-3.5 h-3.5" /> },
      { key: "engine_number", label: "Engine Number", icon: <Hash className="w-3.5 h-3.5" /> },
      { key: "chassis_number", label: "Chassis Number", icon: <Hash className="w-3.5 h-3.5" /> },
      { key: "previous_insurer", label: "Insurance Company", icon: <Shield className="w-3.5 h-3.5" /> },
      { key: "previous_policy_expiry_date", label: "Insurance Expiry", icon: <Calendar className="w-3.5 h-3.5" /> },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Vehicle Information</h2>
          <Badge variant="secondary">
            {data.vehicle_number?.toUpperCase() || "N/A"}
          </Badge>
        </div>
        <Card>
          <CardHeader className="py-3 px-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              <span className="font-medium">{vehicleInfo.make_model || "Vehicle Details"}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {vehicleFields.map(({ key, label, icon }) => {
                const value = vehicleInfo[key];
                if (!value) return null;
                
                return (
                  <div key={key} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-32">
                      {icon}
                      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono break-all" data-testid={`text-vehicle-${key}`}>
                        {value}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7"
                      onClick={() => copyToClipboard(String(value), label)}
                      data-testid={`button-copy-vehicle-${key}`}
                    >
                      {copiedField === key ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vehicle Challan Display
  const challanData = data.challan?.data?.data || [];
  
  if (!challanData || challanData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Challan Status</h2>
          <Badge variant="secondary">
            {data.vehicle_number?.toUpperCase() || "N/A"}
          </Badge>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-green-600">No Pending Challans</p>
            <p className="text-sm text-muted-foreground mt-1">
              This vehicle has no pending traffic challans
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Challan Details</h2>
        <Badge variant="destructive">
          {challanData.length} Pending {challanData.length === 1 ? "Challan" : "Challans"}
        </Badge>
      </div>
      
      {challanData.map((challan: any, index: number) => (
        <Card key={index}>
          <CardHeader className="py-3 px-4 bg-destructive/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-destructive" />
                <span className="font-medium">Challan #{index + 1}</span>
              </div>
              <Badge variant={challan.challan_status === "UNPAID" ? "destructive" : "secondary"}>
                {challan.challan_status || "N/A"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {challan.number && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-32">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">Challan No</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono break-all" data-testid={`text-challan-number-${index}`}>
                      {challan.number}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-7 w-7"
                    onClick={() => copyToClipboard(challan.number, "Challan Number")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              
              {challan.amount?.total && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-32">
                    <CircleDollarSign className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">Amount</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono break-all text-destructive font-semibold" data-testid={`text-challan-amount-${index}`}>
                      Rs. {challan.amount.total}
                    </p>
                  </div>
                </div>
              )}
              
              {challan.violations?.details?.map((violation: any, vIndex: number) => (
                <div key={vIndex} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-32">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">Violation</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm break-all" data-testid={`text-challan-violation-${index}-${vIndex}`}>
                      {violation.offence || "Traffic Violation"}
                    </p>
                  </div>
                </div>
              ))}
              
              {challan.violations?.date && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-32">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">Date</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono break-all" data-testid={`text-challan-date-${index}`}>
                      {new Date(challan.violations.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {challan.state && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-32">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">State</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono break-all" data-testid={`text-challan-state-${index}`}>
                      {challan.state}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardHome() {
  const getSearchParam = (): ServiceType => {
    const params = new URLSearchParams(window.location.search);
    const param = params.get("search");
    const validTypes: ServiceType[] = ["mobile", "email", "aadhar", "pan", "vehicle-info", "vehicle-challan"];
    return validTypes.includes(param as ServiceType) ? (param as ServiceType) : "mobile";
  };
  
  const [activeService, setActiveService] = useState<ServiceType>(getSearchParam());
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const isVehicleSearch = activeService === "vehicle-info" || activeService === "vehicle-challan";

  useEffect(() => {
    const handleSearchTypeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newType = customEvent.detail?.searchType;
      const validTypes: ServiceType[] = ["mobile", "email", "aadhar", "pan", "vehicle-info", "vehicle-challan"];
      if (validTypes.includes(newType)) {
        setActiveService(newType);
        setQuery("");
        setResults([]);
        setVehicleData(null);
        setError("");
        setHasSearched(false);
      }
    };
    
    window.addEventListener('searchTypeChange', handleSearchTypeChange);
    window.addEventListener('popstate', () => setActiveService(getSearchParam()));
    
    return () => {
      window.removeEventListener('searchTypeChange', handleSearchTypeChange);
      window.removeEventListener('popstate', () => setActiveService(getSearchParam()));
    };
  }, []);

  const services = [
    { id: "mobile" as const, label: "Mobile", icon: Phone, placeholder: "Enter mobile number (e.g., 9161570798)" },
    { id: "email" as const, label: "Email", icon: Mail, placeholder: "Enter email address" },
    { id: "aadhar" as const, label: "Aadhar", icon: CreditCard, placeholder: "Enter Aadhar number (e.g., 123456789012)" },
    { id: "pan" as const, label: "PAN", icon: CreditCard, placeholder: "Enter PAN number (e.g., ABCDE1234F)" },
    { id: "vehicle-info" as const, label: "Vehicle", icon: Car, placeholder: "Enter vehicle number (e.g., UP32QP0001)" },
    { id: "vehicle-challan" as const, label: "Challan", icon: FileWarning, placeholder: "Enter vehicle number (e.g., UP32QP0001)" },
  ];

  const activeServiceData = services.find((s) => s.id === activeService)!;

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setError("");
    setResults([]);
    setVehicleData(null);
    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search/${activeService}?query=${encodeURIComponent(query.trim())}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Handle vehicle searches differently
        if (isVehicleSearch) {
          if (data.message) {
            // API returned error message
            setError(data.message);
          } else if (data.data) {
            setVehicleData(data.data);
            toast({ title: "Success", description: "Vehicle data found" });
          } else {
            setError("There are some problem please contact developer");
          }
        } else {
          // Handle regular searches
          if (Array.isArray(data.data)) {
            const uniqueResults = data.data.filter((item: SearchResultItem, idx: number, arr: SearchResultItem[]) => {
              const key = JSON.stringify(item);
              return arr.findIndex((i) => JSON.stringify(i) === key) === idx;
            });
            setResults(uniqueResults);
            if (uniqueResults.length === 0) {
              toast({ title: "No Results", description: "No data found for your search query." });
            } else {
              toast({ title: "Success", description: `Found ${uniqueResults.length} result(s)` });
            }
          } else if (data.data && typeof data.data === "object") {
            if (data.data.error) {
              setError(data.data.error);
            } else {
              setResults([data.data]);
            }
          } else {
            setError("No data found");
          }
        }
      } else {
        setError("There are some problem please contact developer");
      }
    } catch {
      setError("There are some problem please contact developer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleServiceChange = (value: string) => {
    setActiveService(value as ServiceType);
    setQuery("");
    setResults([]);
    setVehicleData(null);
    setError("");
    setHasSearched(false);
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border bg-background sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-lg font-semibold" data-testid="text-page-title">Search Dashboard</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Access all search services</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span className="text-xs">Secure</span>
              </Badge>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Services
                  </CardTitle>
                  <CardDescription>
                    Select a service type and enter your search query
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={activeService} onValueChange={handleServiceChange}>
                    <TabsList className="grid grid-cols-6 w-full">
                      {services.map((service) => (
                        <TabsTrigger
                          key={service.id}
                          value={service.id}
                          className="flex items-center gap-1 text-xs sm:text-sm px-2"
                          data-testid={`tab-${service.id}`}
                        >
                          <service.icon className="w-4 h-4" />
                          <span className="hidden lg:inline">{service.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <activeServiceData.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={activeServiceData.placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="pl-10"
                        data-testid="input-search-query"
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading}
                      className="px-6"
                      data-testid="button-search"
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
                </CardContent>
              </Card>

              {hasSearched && !isLoading && !error && vehicleData && isVehicleSearch && (
                <VehicleResultDisplay 
                  data={vehicleData} 
                  type={activeService as "vehicle-info" | "vehicle-challan"} 
                />
              )}

              {hasSearched && !isLoading && !error && results.length > 0 && !isVehicleSearch && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      Results Found
                    </h2>
                    <Badge variant="secondary">
                      {results.length} {results.length === 1 ? "Result" : "Results"}
                    </Badge>
                  </div>

                  {results.length === 1 ? (
                    <ResultCard result={results[0]} index={0} />
                  ) : (
                    <Accordion type="multiple" defaultValue={["item-0"]} className="space-y-3">
                      {results.map((result, index) => (
                        <AccordionItem
                          key={index}
                          value={`item-${index}`}
                          className="border rounded-lg overflow-hidden bg-card"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="text-xs">
                                Result {index + 1}
                              </Badge>
                              {result.name && (
                                <span className="text-sm font-medium">{result.name}</span>
                              )}
                              {result.mobile && (
                                <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                                  {result.mobile}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-0 pb-0">
                            <div className="divide-y divide-border border-t">
                              {fieldOrder.concat(
                                Object.keys(result).filter((k) => !fieldOrder.includes(k))
                              ).map((key) => {
                                const value = result[key];
                                if (!value) return null;

                                let fieldInfo = fieldLabels[key] || {
                                  label: key.toUpperCase(),
                                  icon: <Hash className="w-3.5 h-3.5" />,
                                };
                                if (key === "id") {
                                  fieldInfo = { ...fieldInfo, label: getIdLabel(value) };
                                }
                                const displayValue = key === "address" ? formatAddress(value) : value;

                                return (
                                  <ResultField
                                    key={key}
                                    fieldKey={key}
                                    label={fieldInfo.label}
                                    icon={fieldInfo.icon}
                                    value={displayValue}
                                    index={index}
                                  />
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              )}

              {hasSearched && !isLoading && !error && results.length === 0 && !vehicleData && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No results found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try a different search query
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ResultField({
  fieldKey,
  label,
  icon,
  value,
  index,
}: {
  fieldKey: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono break-all" data-testid={`text-${fieldKey}-${index}`}>
          {value}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7"
        onClick={copy}
        data-testid={`button-copy-${fieldKey}-${index}`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );
}

export function MobileSearchPage() {
  return <DashboardHome />;
}

export function EmailSearchPage() {
  return <DashboardHome />;
}

export function IdSearchPage() {
  return <DashboardHome />;
}

export default DashboardHome;
