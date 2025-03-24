import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import StarRating from "@/components/ui/star-rating";
import { ChevronDown, ChevronUp } from "lucide-react";

const searchSchema = z.object({
  destination: z.string().optional(),
  departureDate: z.string().optional(),
  duration: z.string().optional(),
  passengers: z.string().optional(),
  departurePort: z.string().optional(),
  minPrice: z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
  maxPrice: z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
  cruiseLine: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  cabinTypes: z.array(z.string()).optional(),
  rating: z.number().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface SearchFiltersProps {
  onSearch: (filters: SearchFormValues) => void;
  initialValues?: Partial<SearchFormValues>;
  className?: string;
}

export default function SearchFilters({
  onSearch,
  initialValues = {},
  className = "",
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ratingValue, setRatingValue] = useState(initialValues.rating || 0);
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      destination: initialValues.destination || "any",
      departureDate: initialValues.departureDate || "",
      duration: initialValues.duration || "any",
      passengers: initialValues.passengers || "2",
      departurePort: initialValues.departurePort || "any",
      minPrice: initialValues.minPrice?.toString() || "",
      maxPrice: initialValues.maxPrice?.toString() || "",
      cruiseLine: initialValues.cruiseLine || [],
      amenities: initialValues.amenities || [],
      cabinTypes: initialValues.cabinTypes || [],
      rating: initialValues.rating || 0,
    },
  });
  
  const onSubmit = (data: SearchFormValues) => {
    onSearch(data);
  };
  
  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };
  
  const resetFilters = () => {
    form.reset({
      destination: "any",
      departureDate: "",
      duration: "any",
      passengers: "2",
      departurePort: "any",
      minPrice: "",
      maxPrice: "",
      cruiseLine: [],
      amenities: [],
      cabinTypes: [],
      rating: 0,
    });
    setRatingValue(0);
  };
  
  const handleRatingChange = (rating: number) => {
    setRatingValue(rating);
    form.setValue("rating", rating);
  };
  
  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Basic Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-neutral-dark">Destination</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-gray-800 font-medium">
                        <SelectValue placeholder="Any Destination" className="text-gray-800" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="any">Any Destination</SelectItem>
                      <SelectItem value="caribbean">Caribbean</SelectItem>
                      <SelectItem value="mediterranean">Mediterranean</SelectItem>
                      <SelectItem value="alaska">Alaska</SelectItem>
                      <SelectItem value="europe">Europe</SelectItem>
                      <SelectItem value="hawaii">Hawaii</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="departureDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-neutral-dark">Departure Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="bg-white border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-gray-800 font-medium" />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-neutral-dark">Duration</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-gray-800 font-medium">
                        <SelectValue placeholder="Any Length" className="text-gray-800" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="any">Any Length</SelectItem>
                      <SelectItem value="1-5">1-5 Nights</SelectItem>
                      <SelectItem value="6-9">6-9 Nights</SelectItem>
                      <SelectItem value="10-14">10-14 Nights</SelectItem>
                      <SelectItem value="15+">15+ Nights</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="passengers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-neutral-dark">Passengers</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-gray-800 font-medium">
                        <SelectValue placeholder="Number of Passengers" className="text-gray-800" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 Passenger</SelectItem>
                      <SelectItem value="2">2 Passengers</SelectItem>
                      <SelectItem value="3">3 Passengers</SelectItem>
                      <SelectItem value="4">4 Passengers</SelectItem>
                      <SelectItem value="5+">5+ Passengers</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-center mt-4">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Search Cruises
            </Button>
          </div>
          
          {/* Advanced Filters Toggle */}
          <div className="mt-6 flex justify-between items-center">
            <h2 className="text-lg font-medium text-muted-foreground">Advanced Filters</h2>
            <Button
              type="button"
              variant="ghost"
              className="text-primary flex items-center"
              onClick={toggleAdvanced}
            >
              <span>{showAdvanced ? "Hide Filters" : "Show Filters"}</span>
              {showAdvanced ? (
                <ChevronUp className="ml-2" />
              ) : (
                <ChevronDown className="ml-2" />
              )}
            </Button>
          </div>
          
          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Price Range</h3>
                  <div className="flex items-center space-x-4">
                    <FormField
                      control={form.control}
                      name="minPrice"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground">$</span>
                              </div>
                              <Input
                                placeholder="Min"
                                type="number"
                                className="pl-7 bg-white border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-gray-800"
                                {...field}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <span className="text-muted-foreground">to</span>
                    <FormField
                      control={form.control}
                      name="maxPrice"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground">$</span>
                              </div>
                              <Input
                                placeholder="Max"
                                type="number"
                                className="pl-7 bg-white border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-gray-800"
                                {...field}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Cruise Line */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Cruise Line</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="cruiseLine"
                      render={({ field }) => (
                        <>
                          {[
                            { id: "carnival", label: "Carnival" },
                            { id: "royal-caribbean", label: "Royal Caribbean" },
                            { id: "norwegian", label: "Norwegian" },
                            { id: "princess", label: "Princess" }
                          ].map((cruiseLine) => (
                            <FormItem
                              key={cruiseLine.id}
                              className="flex items-center space-x-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(cruiseLine.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, cruiseLine.id]);
                                    } else {
                                      field.onChange(
                                        currentValue.filter((value) => value !== cruiseLine.id)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-muted-foreground cursor-pointer">
                                {cruiseLine.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </>
                      )}
                    />
                  </div>
                </div>
                
                {/* Departure Port */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Departure Port</h3>
                  <FormField
                    control={form.control}
                    name="departurePort"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-gray-800 font-medium">
                              <SelectValue placeholder="Any Port" className="text-gray-800" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="any">Any Port</SelectItem>
                            <SelectItem value="miami">Miami, FL</SelectItem>
                            <SelectItem value="fortLauderdale">Fort Lauderdale, FL</SelectItem>
                            <SelectItem value="portCanaveral">Port Canaveral, FL</SelectItem>
                            <SelectItem value="galveston">Galveston, TX</SelectItem>
                            <SelectItem value="seattle">Seattle, WA</SelectItem>
                            <SelectItem value="losAngeles">Los Angeles, CA</SelectItem>
                            <SelectItem value="newYork">New York, NY</SelectItem>
                            <SelectItem value="vancouver">Vancouver, BC</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Ship Amenities */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Ship Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="amenities"
                      render={({ field }) => (
                        <>
                          {[
                            { id: "pools", label: "Swimming Pools" },
                            { id: "casino", label: "Casino" },
                            { id: "spa", label: "Spa" },
                            { id: "kidsClub", label: "Kids Club" }
                          ].map((amenity) => (
                            <FormItem
                              key={amenity.id}
                              className="flex items-center space-x-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(amenity.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, amenity.id]);
                                    } else {
                                      field.onChange(
                                        currentValue.filter((value) => value !== amenity.id)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-muted-foreground cursor-pointer">
                                {amenity.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </>
                      )}
                    />
                  </div>
                </div>
                
                {/* Cabin Type */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Cabin Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="cabinTypes"
                      render={({ field }) => (
                        <>
                          {[
                            { id: "interior", label: "Interior" },
                            { id: "oceanview", label: "Ocean View" },
                            { id: "balcony", label: "Balcony" },
                            { id: "suite", label: "Suite" }
                          ].map((cabinType) => (
                            <FormItem
                              key={cabinType.id}
                              className="flex items-center space-x-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(cabinType.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, cabinType.id]);
                                    } else {
                                      field.onChange(
                                        currentValue.filter((value) => value !== cabinType.id)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-muted-foreground cursor-pointer">
                                {cabinType.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </>
                      )}
                    />
                  </div>
                </div>
                
                {/* Rating */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Rating</h3>
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center">
                              <StarRating 
                                rating={ratingValue} 
                                size="lg" 
                                interactive={true} 
                                onRatingChange={handleRatingChange}
                              />
                              <span className="ml-2 text-sm text-muted-foreground">
                                {ratingValue > 0 ? `${ratingValue}+ stars` : 'Any rating'}
                              </span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-3"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
