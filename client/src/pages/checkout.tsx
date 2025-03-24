import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Make sure to call `loadStripe` outside of a component's render to avoid recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe public key. Payment functionality will be limited.');
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

// CheckoutForm component
const CheckoutForm = ({ bookingId, onSuccess }: { bookingId: string, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation/${bookingId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else {
        // Payment successful without redirect
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed!",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 text-lg shadow-md"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment...
          </span> 
          : 
          <span className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Complete Payment
          </span>
        }
      </Button>
    </form>
  );
};

export default function Checkout() {
  const { bookingId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [clientSecret, setClientSecret] = useState<string>("");
  
  // Fetch booking details
  const { 
    data: booking, 
    isLoading: isBookingLoading,
    isError: isBookingError,
  } = useQuery({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: isAuthenticated,
  });

  // Initialize payment intent when booking data is available
  useEffect(() => {
    if (booking && !clientSecret) {
      const createPaymentIntent = async () => {
        try {
          console.log("Creating payment intent for booking:", bookingId);
          const response = await apiRequest('POST', '/api/create-payment-intent', { bookingId });
          const data = await response.json();
          console.log("Payment intent created successfully:", data);
          setClientSecret(data.clientSecret);
        } catch (error: any) {
          console.error("Payment intent creation failed:", error);
          toast({
            title: "Payment Setup Failed",
            description: error.message || "Could not initialize payment",
            variant: "destructive",
          });
        }
      };
      
      createPaymentIntent();
    }
  }, [booking, bookingId, clientSecret, toast]);

  // Handle payment success
  const handlePaymentSuccess = () => {
    navigate(`/booking-confirmation/${bookingId}`);
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated && !isBookingLoading) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your booking",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isAuthenticated, isBookingLoading, navigate, toast]);

  if (isBookingLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-10 w-1/2 mb-6" />
          <div className="grid grid-cols-1 gap-6">
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isBookingError || !booking) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
        <p className="mb-6">The booking you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="bg-primary hover:bg-primary-dark">
          <a href="/cruises">Browse Cruises</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-lightest">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Complete Your Booking</h1>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Booking Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
                <CardDescription>Review your booking details before payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <img 
                    src={booking.cruise.imageUrl} 
                    alt={booking.cruise.title} 
                    className="w-20 h-20 object-cover rounded-md mr-4"
                  />
                  <div>
                    <h3 className="font-bold">{booking.cruise.title}</h3>
                    <p className="text-sm text-muted-foreground">{booking.cruise.cruiseLine}</p>
                  </div>
                </div>
                
                <div className="border-t border-b py-4 my-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking ID</span>
                    <span>#{booking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departure</span>
                    <span>{formatDate(booking.departureDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Return</span>
                    <span>{formatDate(booking.returnDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{
                      Math.ceil((new Date(booking.returnDate).getTime() - new Date(booking.departureDate).getTime()) / (1000 * 60 * 60 * 24))
                    } Nights</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cabin Type</span>
                    <span>{booking.cabinType.charAt(0).toUpperCase() + booking.cabinType.slice(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passengers</span>
                    <span>{booking.numberOfGuests}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold">Total Price</span>
                  <span className="text-2xl font-bold text-red-500">
                    ${booking.totalPrice.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Your payment information is securely processed</CardDescription>
              </CardHeader>
              <CardContent>
                {clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm bookingId={bookingId} onSuccess={handlePaymentSuccess} />
                  </Elements>
                ) : (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
