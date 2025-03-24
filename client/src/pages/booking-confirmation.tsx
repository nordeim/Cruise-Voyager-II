import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Check, Calendar, Ship, MapPin, Clock, Users, CreditCard, Mail } from "lucide-react";

export default function BookingConfirmation() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  // Fetch booking details
  const { 
    data: booking, 
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [`/api/bookings/${id}`],
    enabled: isAuthenticated,
  });

  // Format dates for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Calculate total nights
  const calculateNights = (departureDate: string, returnDate: string) => {
    return Math.ceil((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  // Refetch booking when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    }
  }, [isAuthenticated, refetch]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-10 w-1/2 mb-6" />
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-12 w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
        <p className="mb-6">The booking confirmation you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="bg-primary hover:bg-primary-dark">
          <Link href="/cruises">Browse Cruises</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-lightest">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-success text-white rounded-full w-16 h-16 mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">
              Your booking confirmation has been sent to {booking.contactEmail}
            </p>
          </div>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Booking Details</h2>
                <span className="text-sm text-muted-foreground">Booking #{booking.id}</span>
              </div>
              
              <div className="flex items-center mb-6">
                <img 
                  src={booking.cruise.imageUrl} 
                  alt={booking.cruise.title} 
                  className="w-20 h-20 object-cover rounded-md mr-4"
                />
                <div>
                  <h3 className="font-bold">{booking.cruise.title}</h3>
                  <p className="text-sm text-muted-foreground">{booking.cruise.cruiseLine}</p>
                  <p className="text-sm text-muted-foreground">{booking.cruise.shipName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departure Date</p>
                    <p className="font-medium">{formatDate(booking.departureDate)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Return Date</p>
                    <p className="font-medium">{formatDate(booking.returnDate)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{calculateNights(booking.departureDate, booking.returnDate)} Nights</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Ship className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cabin Type</p>
                    <p className="font-medium">{booking.cabinType.charAt(0).toUpperCase() + booking.cabinType.slice(1)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departure Port</p>
                    <p className="font-medium">{booking.cruise.departurePort}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Passengers</p>
                    <p className="font-medium">{booking.numberOfGuests}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CreditCard className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <p className={`font-medium ${
                      booking.paymentStatus === 'completed' 
                        ? 'text-success' 
                        : booking.paymentStatus === 'pending' 
                          ? 'text-warning' 
                          : 'text-destructive'
                    }`}>
                      {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Email</p>
                    <p className="font-medium">{booking.contactEmail}</p>
                  </div>
                </div>
              </div>
              
              {booking.specialRequests && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Special Requests</h4>
                  <p className="text-sm text-muted-foreground bg-neutral-lightest p-3 rounded-md">
                    {booking.specialRequests}
                  </p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total Price</span>
                  <span className="text-2xl font-bold text-secondary">
                    ${booking.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              A confirmation email has been sent to your email address with all booking details.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild className="bg-primary hover:bg-primary-dark text-white font-bold py-2 shadow-md">
                <Link href="/my-bookings" className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View All Bookings
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-2 font-semibold py-2 shadow-sm">
                <Link href="/" className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Return Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
