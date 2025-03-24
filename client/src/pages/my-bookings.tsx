import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarDays, Ship, Clock, MapPin, Users, Anchor, AlertTriangle } from "lucide-react";

export default function MyBookings() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");

  // Fetch user bookings
  const { 
    data: bookings, 
    isLoading: isBookingsLoading,
    refetch: refetchBookings
  } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: isAuthenticated,
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Get status badge properties
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { variant: 'success' as const, label: 'Paid' };
      case 'pending':
        return { variant: 'warning' as const, label: 'Pending Payment' };
      case 'cancelled':
        return { variant: 'destructive' as const, label: 'Cancelled' };
      default:
        return { variant: 'secondary' as const, label: status };
    }
  };

  // Filter bookings by status
  const getFilteredBookings = () => {
    if (!bookings || bookings.length === 0) return [];
    
    const today = new Date();
    
    if (activeTab === 'upcoming') {
      return bookings.filter((booking: any) => 
        new Date(booking.departureDate) > today && booking.paymentStatus !== 'cancelled'
      );
    } else if (activeTab === 'past') {
      return bookings.filter((booking: any) => 
        new Date(booking.returnDate) < today && booking.paymentStatus !== 'cancelled'
      );
    } else if (activeTab === 'pending') {
      return bookings.filter((booking: any) => 
        booking.paymentStatus === 'pending'
      );
    }
    
    return bookings;
  };

  // Refetch bookings when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      refetchBookings();
    }
  }, [isAuthenticated, refetchBookings]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your bookings",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isAuthLoading, isAuthenticated, navigate, toast]);

  const isLoading = isAuthLoading || isBookingsLoading;
  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-neutral-lightest">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
        
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="pending">Pending Payment</TabsTrigger>
            <TabsTrigger value="all">All Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="p-0">
                    <div className="md:flex">
                      <div className="md:w-1/4">
                        <Skeleton className="h-48 md:h-full w-full" />
                      </div>
                      <div className="p-6 md:w-3/4">
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-full" />
                        </div>
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-8 w-32" />
                          <Skeleton className="h-10 w-32" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredBookings.length > 0 ? (
              // Booking cards
              filteredBookings.map((booking: any) => (
                <Card key={booking.id} className="mb-4 hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="md:flex">
                      <div className="md:w-1/4 relative">
                        <img 
                          src={booking.cruise.imageUrl} 
                          alt={booking.cruise.title} 
                          className="w-full h-48 md:h-full object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge variant={getStatusBadge(booking.paymentStatus).variant}>
                            {getStatusBadge(booking.paymentStatus).label}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6 md:w-3/4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                          <div>
                            <h2 className="text-xl font-bold mb-1">{booking.cruise.title}</h2>
                            <p className="text-sm text-muted-foreground">
                              {booking.cruise.cruiseLine} - {booking.cruise.shipName}
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0 text-right">
                            <p className="text-sm text-muted-foreground">Booking #{booking.id}</p>
                            <p className="text-lg font-bold text-secondary">${booking.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <p className="text-xs text-muted-foreground">Departure</p>
                              <p className="text-sm">{formatDate(booking.departureDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <p className="text-xs text-muted-foreground">Return</p>
                              <p className="text-sm">{formatDate(booking.returnDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="text-sm">{
                                Math.ceil((new Date(booking.returnDate).getTime() - new Date(booking.departureDate).getTime()) / (1000 * 60 * 60 * 24))
                              } Nights</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <p className="text-xs text-muted-foreground">Departure Port</p>
                              <p className="text-sm">{booking.cruise.departurePort}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Ship className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <p className="text-xs text-muted-foreground">Cabin Type</p>
                              <p className="text-sm">{booking.cabinType.charAt(0).toUpperCase() + booking.cabinType.slice(1)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <p className="text-xs text-muted-foreground">Passengers</p>
                              <p className="text-sm">{booking.numberOfGuests}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
                          {booking.paymentStatus === 'pending' ? (
                            <div className="flex items-center text-warning mb-2 sm:mb-0">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span className="text-sm">Payment required to confirm booking</span>
                            </div>
                          ) : (
                            <div></div>
                          )}
                          
                          <div className="flex gap-2">
                            {booking.paymentStatus === 'pending' && (
                              <Button asChild className="bg-secondary hover:bg-secondary-dark text-white">
                                <Link href={`/checkout/${booking.id}`}>Complete Payment</Link>
                              </Button>
                            )}
                            <Button asChild variant="outline">
                              <Link href={`/booking-confirmation/${booking.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // No bookings
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Anchor className="h-16 w-16 text-primary/40 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No {activeTab} Bookings Found</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {activeTab === 'upcoming' && "You don't have any upcoming cruises booked yet."}
                  {activeTab === 'past' && "You don't have any past cruise bookings."}
                  {activeTab === 'pending' && "You don't have any pending payments for cruises."}
                  {activeTab === 'all' && "You haven't booked any cruises yet."}
                </p>
                <Button asChild className="bg-primary hover:bg-primary-dark">
                  <Link href="/cruises">Browse Cruises</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
