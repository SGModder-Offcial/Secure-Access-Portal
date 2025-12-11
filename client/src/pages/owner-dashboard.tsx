import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Admin } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Shield,
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  UserCheck,
  UserX,
  Phone,
  Mail,
  CreditCard,
  Copy,
  Check,
  User,
  MapPin,
  Wifi,
  Hash,
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
  alt: { label: "Alt Mobile", icon: <Phone className="w-3.5 h-3.5" /> },
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
  return addr.replace(/^!+/, "").replace(/!+/g, ", ").replace(/,\s*,/g, ",").replace(/,\s*$/g, "").replace(/^\s*,\s*/g, "").trim();
}

type OwnerServiceType = "mobile" | "email" | "aadhar" | "pan" | "vehicle-info" | "vehicle-challan";

function OwnerVehicleResultDisplay({ 
  data, 
  type, 
  copyToClipboard, 
  copiedField 
}: { 
  data: any; 
  type: "vehicle-info" | "vehicle-challan";
  copyToClipboard: (value: string, label: string) => void;
  copiedField: string | null;
}) {
  if (type === "vehicle-info") {
    const vehicleInfo = data.vehicle?.data || {};
    
    if (!vehicleInfo || Object.keys(vehicleInfo).length === 0) {
      return (
        <div className="py-8 text-center">
          <Car className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No vehicle information found</p>
        </div>
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
      { key: "previous_insurer", label: "Insurance", icon: <Shield className="w-3.5 h-3.5" /> },
      { key: "previous_policy_expiry_date", label: "Insurance Expiry", icon: <Calendar className="w-3.5 h-3.5" /> },
    ];

    return (
      <>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Vehicle Information</h3>
          <Badge variant="secondary">{data.vehicle_number?.toUpperCase() || "N/A"}</Badge>
        </div>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
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
                    <p className="text-sm font-mono break-all">{value}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => copyToClipboard(String(value), label)}>
                    {copiedField === String(value) ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </>
    );
  }

  // Vehicle Challan Display
  const challanData = data.challan?.data?.data || [];
  
  if (!challanData || challanData.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Challan Status</h3>
          <Badge variant="secondary">{data.vehicle_number?.toUpperCase() || "N/A"}</Badge>
        </div>
        <div className="py-8 text-center">
          <Check className="w-10 h-10 mx-auto text-green-500 mb-3" />
          <p className="text-lg font-medium text-green-600">No Pending Challans</p>
          <p className="text-sm text-muted-foreground mt-1">This vehicle has no pending traffic challans</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Challan Details</h3>
        <Badge variant="destructive">{challanData.length} Pending</Badge>
      </div>
      
      {challanData.map((challan: any, index: number) => (
        <Card key={index}>
          <CardHeader className="py-3 px-4 bg-destructive/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-destructive" />
                <span className="font-medium text-sm">Challan #{index + 1}</span>
              </div>
              <Badge variant={challan.challan_status === "UNPAID" ? "destructive" : "secondary"} className="text-xs">
                {challan.challan_status || "N/A"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {challan.number && (
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">Challan No</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono break-all">{challan.number}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => copyToClipboard(challan.number, "Challan Number")}>
                  {copiedField === challan.number ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            )}
            
            {challan.amount?.total && (
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                  <CircleDollarSign className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">Amount</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono break-all text-destructive font-semibold">Rs. {challan.amount.total}</p>
                </div>
              </div>
            )}
            
            {challan.violations?.details?.map((violation: any, vIndex: number) => (
              <div key={vIndex} className="flex items-start gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">Violation</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm break-all">{violation.offence || "Traffic Violation"}</p>
                </div>
              </div>
            ))}
            
            {challan.violations?.date && (
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">Date</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono break-all">{new Date(challan.violations.date).toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {challan.state && (
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">State</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono break-all">{challan.state}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function OwnerSearchSection() {
  const getSearchParam = (): OwnerServiceType => {
    const params = new URLSearchParams(window.location.search);
    const param = params.get("search");
    const validTypes: OwnerServiceType[] = ["mobile", "email", "aadhar", "pan", "vehicle-info", "vehicle-challan"];
    return validTypes.includes(param as OwnerServiceType) ? (param as OwnerServiceType) : "mobile";
  };
  
  const [activeService, setActiveService] = useState<OwnerServiceType>(getSearchParam());
  
  useEffect(() => {
    const handleSearchTypeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newType = customEvent.detail?.searchType;
      const validTypes: OwnerServiceType[] = ["mobile", "email", "aadhar", "pan", "vehicle-info", "vehicle-challan"];
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
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const isVehicleSearch = activeService === "vehicle-info" || activeService === "vehicle-challan";

  const services = [
    { id: "mobile" as const, label: "Mobile", icon: Phone, placeholder: "Enter mobile number" },
    { id: "email" as const, label: "Email", icon: Mail, placeholder: "Enter email address" },
    { id: "aadhar" as const, label: "Aadhar", icon: CreditCard, placeholder: "Enter Aadhar number" },
    { id: "pan" as const, label: "PAN", icon: CreditCard, placeholder: "Enter PAN number" },
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
      const res = await fetch(`/api/search/${activeService}?query=${encodeURIComponent(query.trim())}`, { credentials: "include" });
      const data = await res.json();

      if (res.ok && data.success) {
        if (isVehicleSearch) {
          if (data.message) {
            setError(data.message);
          } else if (data.data) {
            setVehicleData(data.data);
            toast({ title: "Success", description: "Vehicle data found" });
          } else {
            setError("There are some problem please contact developer");
          }
        } else {
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

  const copyToClipboard = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(value);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleServiceChange = (value: string) => {
    setActiveService(value as OwnerServiceType);
    setQuery("");
    setResults([]);
    setVehicleData(null);
    setError("");
    setHasSearched(false);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Services
        </CardTitle>
        <CardDescription>Select a service type and enter your search query</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={activeService} onValueChange={handleServiceChange}>
          <SelectTrigger className="w-full" data-testid="select-owner-service">
            <SelectValue>
              <div className="flex items-center gap-2">
                <activeServiceData.icon className="w-4 h-4" />
                <span>{activeServiceData.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id} data-testid={`option-owner-${service.id}`}>
                <div className="flex items-center gap-2">
                  <service.icon className="w-4 h-4" />
                  <span>{service.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <activeServiceData.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={activeServiceData.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              disabled={isLoading}
              className="pl-10"
              data-testid="input-owner-search"
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading} className="px-6" data-testid="button-owner-search">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {hasSearched && !isLoading && !error && vehicleData && isVehicleSearch && (
          <div className="space-y-4 pt-4 border-t">
            <OwnerVehicleResultDisplay data={vehicleData} type={activeService as "vehicle-info" | "vehicle-challan"} copyToClipboard={copyToClipboard} copiedField={copiedField} />
          </div>
        )}

        {hasSearched && !isLoading && !error && results.length > 0 && !isVehicleSearch && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Results Found</h3>
              <Badge variant="secondary">{results.length} {results.length === 1 ? "Result" : "Results"}</Badge>
            </div>

            {results.length === 1 ? (
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {fieldOrder.concat(Object.keys(results[0]).filter((k) => !fieldOrder.includes(k))).map((key) => {
                    const value = results[0][key];
                    if (!value) return null;
                    let fieldInfo = fieldLabels[key] || { label: key.toUpperCase(), icon: <Hash className="w-3.5 h-3.5" /> };
                    if (key === "id") fieldInfo = { ...fieldInfo, label: getIdLabel(value) };
                    const displayValue = key === "address" ? formatAddress(value) : value;

                    return (
                      <div key={key} className="flex items-start gap-3 px-4 py-3">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                          {fieldInfo.icon}
                          <span className="text-xs font-medium uppercase tracking-wide">{fieldInfo.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono break-all">{displayValue}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => copyToClipboard(displayValue, fieldInfo.label)}>
                          {copiedField === displayValue ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" defaultValue={["item-0"]} className="space-y-2">
                {results.map((result, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg overflow-hidden bg-card">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">Result {index + 1}</Badge>
                        {result.name && <span className="text-sm font-medium">{result.name}</span>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <div className="divide-y divide-border border-t">
                        {fieldOrder.concat(Object.keys(result).filter((k) => !fieldOrder.includes(k))).map((key) => {
                          const value = result[key];
                          if (!value) return null;
                          let fieldInfo = fieldLabels[key] || { label: key.toUpperCase(), icon: <Hash className="w-3.5 h-3.5" /> };
                          if (key === "id") fieldInfo = { ...fieldInfo, label: getIdLabel(value) };
                          const displayValue = key === "address" ? formatAddress(value) : value;

                          return (
                            <div key={key} className="flex items-start gap-3 px-4 py-3">
                              <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                                {fieldInfo.icon}
                                <span className="text-xs font-medium uppercase tracking-wide">{fieldInfo.label}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-mono break-all">{displayValue}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => copyToClipboard(displayValue, fieldInfo.label)}>
                                {copiedField === displayValue ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
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
          <div className="py-8 text-center">
            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search query</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OwnerLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

function OwnerLayout({ children, title, subtitle }: OwnerLayoutProps) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 glass sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-lg font-semibold" data-testid="text-page-title">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="hidden sm:flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span className="text-xs">Owner Access</span>
              </Badge>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function OwnerDashboard() {
  const { data: stats, isLoading } = useQuery<{ totalAdmins: number; activeAdmins: number; recentSearches: number }>({
    queryKey: ["/api/owner/stats"],
  });

  return (
    <OwnerLayout title="Owner Dashboard" subtitle="System overview and management">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 p-0 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Admins</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-1 sm:p-4 sm:pt-0">
              {isLoading ? (
                <Skeleton className="h-6 w-10 sm:h-8 sm:w-16" />
              ) : (
                <div className="text-lg sm:text-2xl font-bold" data-testid="text-total-admins">
                  {stats?.totalAdmins || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 p-0 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Admins</CardTitle>
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-0 pt-1 sm:p-4 sm:pt-0">
              {isLoading ? (
                <Skeleton className="h-6 w-10 sm:h-8 sm:w-16" />
              ) : (
                <div className="text-lg sm:text-2xl font-bold" data-testid="text-active-admins">
                  {stats?.activeAdmins || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 p-0 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Searches</CardTitle>
              <Search className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-1 sm:p-4 sm:pt-0">
              {isLoading ? (
                <Skeleton className="h-6 w-10 sm:h-8 sm:w-16" />
              ) : (
                <div className="text-lg sm:text-2xl font-bold" data-testid="text-recent-searches">
                  {stats?.recentSearches || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <OwnerSearchSection />
      </div>
    </OwnerLayout>
  );
}

export function AdminManagement() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    status: "active" as "active" | "inactive",
  });

  const { data: admins, isLoading, error } = useQuery<Admin[]>({
    queryKey: ["/api/owner/admins"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/owner/admins", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: "Admin created successfully" });
        setIsCreateOpen(false);
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["/api/owner/admins"] });
        queryClient.invalidateQueries({ queryKey: ["/api/owner/stats"] });
      } else {
        toast({ title: "Error", description: data.error || "Failed to create admin", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create admin", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await apiRequest("PUT", `/api/owner/admins/${id}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: "Admin updated successfully" });
        setIsEditOpen(false);
        setSelectedAdmin(null);
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["/api/owner/admins"] });
        queryClient.invalidateQueries({ queryKey: ["/api/owner/stats"] });
      } else {
        toast({ title: "Error", description: data.error || "Failed to update admin", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update admin", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/owner/admins/${id}`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: "Admin deleted successfully" });
        setIsDeleteOpen(false);
        setSelectedAdmin(null);
        queryClient.invalidateQueries({ queryKey: ["/api/owner/admins"] });
        queryClient.invalidateQueries({ queryKey: ["/api/owner/stats"] });
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete admin", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete admin", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      status: "active",
    });
  };

  const openEditDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({
      username: admin.username,
      password: "",
      name: admin.name,
      email: admin.email,
      status: admin.status,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteOpen(true);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedAdmin?._id) return;
    const updateData: Partial<typeof formData> = { ...formData };
    if (!updateData.password) {
      delete updateData.password;
    }
    updateMutation.mutate({ id: selectedAdmin._id, data: updateData });
  };

  const handleDelete = () => {
    if (!selectedAdmin?._id) return;
    deleteMutation.mutate(selectedAdmin._id);
  };

  return (
    <OwnerLayout title="Admin Management" subtitle="Create, edit, and manage admin accounts">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Admin Accounts</CardTitle>
            <CardDescription>Manage all admin users in the system</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-admin" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogDescription>Add a new admin account to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Full Name</Label>
                  <Input
                    id="create-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    data-testid="input-admin-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    data-testid="input-admin-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-username">Username</Label>
                  <Input
                    id="create-username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    data-testid="input-admin-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password (min 6 characters)"
                    data-testid="input-admin-password"
                  />
                  {formData.password && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              formData.password.length >= 12 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) && /[^A-Za-z0-9]/.test(formData.password)
                                ? 'w-full bg-green-500'
                                : formData.password.length >= 8 && (/[A-Z]/.test(formData.password) || /[0-9]/.test(formData.password))
                                ? 'w-3/4 bg-yellow-500'
                                : formData.password.length >= 6
                                ? 'w-1/2 bg-orange-500'
                                : 'w-1/4 bg-red-500'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          formData.password.length >= 12 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) && /[^A-Za-z0-9]/.test(formData.password)
                            ? 'text-green-500'
                            : formData.password.length >= 8 && (/[A-Z]/.test(formData.password) || /[0-9]/.test(formData.password))
                            ? 'text-yellow-500'
                            : formData.password.length >= 6
                            ? 'text-orange-500'
                            : 'text-red-500'
                        }`}>
                          {formData.password.length >= 12 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) && /[^A-Za-z0-9]/.test(formData.password)
                            ? 'Strong'
                            : formData.password.length >= 8 && (/[A-Z]/.test(formData.password) || /[0-9]/.test(formData.password))
                            ? 'Good'
                            : formData.password.length >= 6
                            ? 'Fair'
                            : 'Weak'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className={`flex items-center gap-1 ${formData.password.length >= 6 ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {formData.password.length >= 6 ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>Min 6 characters</span>
                        </div>
                        <div className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {/[A-Z]/.test(formData.password) ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>Uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {/[0-9]/.test(formData.password) ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>Number</span>
                        </div>
                        <div className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {/[^A-Za-z0-9]/.test(formData.password) ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>Special character</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as "active" | "inactive" })}
                  >
                    <SelectTrigger data-testid="select-admin-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-confirm-create">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Admin
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>Failed to load admins</span>
            </div>
          ) : admins && admins.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Username</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin._id} data-testid={`row-admin-${admin._id}`}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-sm">{admin.username}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant={admin.status === "active" ? "default" : "secondary"}>
                          {admin.status === "active" ? (
                            <UserCheck className="w-3 h-3 mr-1" />
                          ) : (
                            <UserX className="w-3 h-3 mr-1" />
                          )}
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(admin)}
                            data-testid={`button-edit-admin-${admin._id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(admin)}
                            data-testid={`button-delete-admin-${admin._id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No admin accounts yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first admin to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Update admin account details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-edit-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                data-testid="input-edit-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
                data-testid="input-edit-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as "active" | "inactive" })}
              >
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-confirm-update">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the admin account for "{selectedAdmin?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
}

export default OwnerDashboard;
