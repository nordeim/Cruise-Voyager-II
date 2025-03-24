import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import CabinSelector from "@/components/booking/cabin-selector";
import PassengerForm from "@/components/booking/passenger-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define booking form schema
const bookingSchema = z.object({
  numberOfGuests: z.number().min(1, "At least one passenger is required").max(10, "Maximum 10 passengers allowed"),
  cabinType: z.string().min(1, "Please select a cabin type"),
  specialRequests: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().optional(),
  passengers: z.array(
    z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      dateOfBirth: z.string().min(1, "Date of birth is required"),
      citizenship: z.string().min(1, "Citizenship is required"),
    })
  ).min(1, "At least one passenger is required"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function Booking() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [selectedCabinType, setSelectedCabinType] = useState<string>("");
  const [selectedCabinPrice, setSelectedCabinPrice] = useState<number>(0);
  const [passengerCount, setPassengerCount] = useState<number>(2);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // Fetch cruise details
  const { 
    data: cruise, 
    isLoading,
    isError
  } = useQuery({
    queryKey: [`/api/cruises/${id}`],
    retry: 3,
    staleTime: 60000
  });

  // Handle cabin selection
  const handleCabinSelect = (cabinType: string, price: number) => {
    setSelectedCabinType(cabinType);
    setSelectedCabinPrice(price);
    form.setValue("cabinType", cabinType);
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    return selectedCabinPrice * passengerCount;
  };

  // Initialize form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      numberOfGuests: 2,
      cabinType: "",
      specialRequests: "",
      contactEmail: user?.email || "",
      contactPhone: "",
      passengers: [
        { firstName: "", lastName: "", dateOfBirth: "", citizenship: "" },
        { firstName: "", lastName: "", dateOfBirth: "", citizenship: "" },
      ],
    },
  });

  // Update form when passenger count changes
  const updatePassengerFields = (count: number) => {
    const currentPassengers = form.getValues("passengers");
    const newPassengers = [...currentPassengers];
    
    if (count > currentPassengers.length) {
      // Add more passenger fields
      for (let i = currentPassengers.length; i < count; i++) {
        newPassengers.push({ firstName: "", lastName: "", dateOfBirth: "", citizenship: "" });
      }
    } else if (count < currentPassengers.length) {
      // Remove passenger fields
      newPassengers.splice(count);
    }
    
    form.setValue("passengers", newPassengers);
    setPassengerCount(count);
    form.setValue("numberOfGuests", count);
  };

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      try {
        console.log("Submitting booking data:", bookingData);
        const response = await apiRequest('POST', '/api/bookings', bookingData);
        const responseData = await response.json();
        console.log("Booking created successfully:", responseData);
        return responseData;
      } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Booking created",
        description: "Your booking has been created successfully",
      });
      // Navigate to checkout page
      console.log("Navigating to checkout page", data.id);
      navigate(`/checkout/${data.id}`);
    },
    onError: (error: any) => {
      console.error("Booking mutation error:", error);
      toast({
        title: "Booking failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (data: BookingFormValues) => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    
    // Add cruise details to booking
    const bookingData = {
      ...data,
      cruiseId: Number(id),
      departureDate: cruise.departureDate,
      returnDate: cruise.returnDate,
      totalPrice: calculateTotalPrice(),
      guestDetails: data.passengers,
    };
    
    createBookingMutation.mutate(bookingData);
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full mb-6" />
            <Skeleton className="h-10 w-1/2 mb-4" />
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-10 w-1/2 mb-4" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !cruise) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Cruise Not Found</h1>
        <p className="mb-6">The cruise you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="bg-primary hover:bg-primary-dark">
          <a href="/cruises">Browse All Cruises</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-lightest">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Book Your Cruise</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Cabin Selection */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">1. Select Your Cabin</h2>
                  
                  <CabinSelector
                    cabinTypes={cruise.cabinTypes}
                    basePrice={cruise.salePrice || cruise.pricePerPerson}
                    onSelect={handleCabinSelect}
                    selectedCabinType={selectedCabinType}
                  />
                  
                  {form.formState.errors.cabinType && (
                    <p className="text-destructive text-sm mt-2">
                      {form.formState.errors.cabinType.message}
                    </p>
                  )}
                </div>
                
                {/* Passenger Information */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">2. Passenger Information</h2>
                  
                  <div className="mb-6">
                    <FormLabel className="mb-2 block">Number of Passengers</FormLabel>
                    <div className="flex items-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10"
                        onClick={() => passengerCount > 1 && updatePassengerFields(passengerCount - 1)}
                        disabled={passengerCount <= 1}
                      >
                        -
                      </Button>
                      <span className="mx-4 font-bold">{passengerCount}</span>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10"
                        onClick={() => passengerCount < 10 && updatePassengerFields(passengerCount + 1)}
                        disabled={passengerCount >= 10}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  
                  <PassengerForm form={form} passengerCount={passengerCount} />
                </div>
                
                {/* Contact Information */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">3. Contact Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address*</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="specialRequests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Requests (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Let us know if you have any special requests or requirements"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 text-lg shadow-md"
                    disabled={createBookingMutation.isPending || selectedCabinType === ""}
                  >
                    {createBookingMutation.isPending ? 
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span> 
                      : 
                      <span className="flex items-center">
                        Continue to Payment
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          
          {/* Booking Summary */}
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
              <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
              
              <div className="flex items-center mb-4">
                <img 
                  src={cruise.imageUrl} 
                  alt={cruise.title} 
                  className="w-20 h-20 object-cover rounded-md mr-4"
                />
                <div>
                  <h3 className="font-bold">{cruise.title}</h3>
                  <p className="text-sm text-muted-foreground">{cruise.cruiseLine}</p>
                </div>
              </div>
              
              <div className="border-t border-b py-4 my-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Departure</span>
                  <span>{formatDate(cruise.departureDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Return</span>
                  <span>{formatDate(cruise.returnDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{cruise.duration} Nights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Departure Port</span>
                  <span>{cruise.departurePort}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Selected Cabin</span>
                  <span className="font-medium">
                    {selectedCabinType 
                      ? selectedCabinType.charAt(0).toUpperCase() + selectedCabinType.slice(1) 
                      : "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Passengers</span>
                  <span className="font-medium">{passengerCount}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Price per person</span>
                  <span className="font-medium">${selectedCabinPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total Price</span>
                  <span className="text-2xl font-bold text-secondary">
                    ${selectedCabinType ? calculateTotalPrice().toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Dialog */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Sign In Required</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">You need to be signed in to book a cruise.</p>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 justify-center">
              <Button 
                className="bg-primary hover:bg-primary-dark"
                onClick={() => {
                  setLoginModalOpen(false);
                  // Store booking data temporarily
                  sessionStorage.setItem(
                    'pendingBooking', 
                    JSON.stringify({
                      cruiseId: id,
                      formData: form.getValues()
                    })
                  );
                  // Redirect to login
                  navigate(`/`);
                  // Open login modal through an event after navigation
                  setTimeout(() => {
                    const openLoginEvent = new CustomEvent('openLoginModal');
                    document.dispatchEvent(openLoginEvent);
                  }, 300);
                }}
              >
                Sign In
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLoginModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
