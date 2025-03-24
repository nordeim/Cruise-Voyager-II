import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Calendar, 
  Ship, 
  Anchor, 
  Clock, 
  DollarSign, 
  Users, 
  MapPin, 
  Heart,
  CalendarRange
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/ui/star-rating";
import ReviewCard from "@/components/ui/review-card";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import AmenitiesList from "@/components/cruise/amenities-list";
import ReviewForm from "@/components/cruise/review-form";

export default function CruiseDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Fetch cruise details
  const { 
    data: cruise, 
    isLoading,
    isError
  } = useQuery({
    queryKey: [`/api/cruises/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/cruises/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cruise details');
      }
      return response.json();
    }
  });

  // Fetch cruise reviews
  const { 
    data: reviews,
    isLoading: isReviewsLoading,
    refetch: refetchReviews
  } = useQuery({
    queryKey: [`/api/cruises/${id}/reviews`],
    queryFn: async () => {
      const response = await fetch(`/api/cruises/${id}/reviews`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return response.json();
    }
  });

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return await fetch(`/api/cruises/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('Failed to submit review');
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for sharing your experience!",
      });
      refetchReviews();
      // Invalidate cruise details to update rating
      queryClient.invalidateQueries({ queryKey: [`/api/cruises/${id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error('Please log in to book a cruise');
      }
      if (!cruise) {
        throw new Error('Cruise details not available');
      }
      if (!user?.email) {
        throw new Error('User email not available');
      }

      // Default to 2 passengers since price is based on double occupancy
      const numberOfGuests = 2;
      const cabinType = cruise.cabinTypes[0] || 'interior'; // Default to first available cabin type
      const pricePerPerson = cruise.salePrice || cruise.pricePerPerson;
      const totalPrice = pricePerPerson * numberOfGuests;

      // Default date for dateOfBirth (must be a valid date string)
      const defaultDateOfBirth = '1990-01-01';

      // Parse dates to ensure they're in the correct format
      const departureDate = new Date(cruise.departureDate);
      const returnDate = new Date(cruise.returnDate);

      // Validate dates
      if (isNaN(departureDate.getTime()) || isNaN(returnDate.getTime())) {
        throw new Error('Invalid cruise dates');
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cruiseId: parseInt(id || '0'),
          userId: user?.id,
          numberOfGuests,
          cabinType,
          pricePerPerson,
          totalPrice,
          departureDate,
          returnDate,
          contactEmail: user.email,
          passengers: [
            {
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email,
              dateOfBirth: defaultDateOfBirth,
              passportNumber: 'TBD',
              nationality: 'TBD'
            },
            {
              firstName: 'Guest',
              lastName: 'TBD',
              email: user.email,
              dateOfBirth: defaultDateOfBirth,
              passportNumber: 'TBD',
              nationality: 'TBD'
            }
          ]
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create booking');
      }
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = `/checkout/${data.id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      setIsBooking(false);
    },
  });

  // Create formatted dates
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Toggle save cruise
  const toggleSave = () => {
    setIsSaved(!isSaved);
    
    toast({
      title: isSaved ? "Removed from saved cruises" : "Added to saved cruises",
      description: isSaved 
        ? "This cruise has been removed from your saved list" 
        : "This cruise has been saved for later",
    });
  };

  // Handle submit review
  const handleSubmitReview = (data: any) => {
    addReviewMutation.mutate(data);
  };

  // Check if user has already reviewed this cruise
  const hasUserReviewed = reviews?.some((review: any) => review.userId === user?.id);

  const handleBooking = () => {
    setIsBooking(true);
    createBookingMutation.mutate();
  };

  // Redirect if cruise not found
  useEffect(() => {
    if (isError) {
      toast({
        title: "Cruise not found",
        description: "The cruise you're looking for doesn't exist",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative h-96">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="p-6">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <div className="flex items-center mb-4">
              <Skeleton className="h-4 w-32 mr-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-28 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-16 w-40" />
              <Skeleton className="h-12 w-32" />
            </div>
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
          <Link href="/cruises">Browse All Cruises</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-lightest">
      {/* Hero Image */}
      <div className="relative h-96">
        <img 
          src={cruise.imageUrl} 
          alt={`${cruise.title} cruise ship`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent">
          <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {cruise.title}
            </h1>
            <div className="flex items-center text-white mb-2">
              <Ship className="mr-2 h-5 w-5" />
              <span className="mr-4">{cruise.cruiseLine}</span>
              <Anchor className="mr-2 h-5 w-5" />
              <span>{cruise.shipName}</span>
            </div>
            <div className="flex items-center">
              <StarRating rating={cruise.rating} className="mr-2" size="md" />
              <span className="text-white">
                {cruise.rating.toFixed(1)} ({cruise.reviewCount} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cruise Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Cruise Overview</h2>
                <p className="text-muted-foreground mb-6">
                  {cruise.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-medium">{cruise.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Departure</p>
                      <p className="font-medium">{formatDate(cruise.departureDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CalendarRange className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Return</p>
                      <p className="font-medium">{formatDate(cruise.returnDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{cruise.duration} Nights</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Anchor className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Departure Port</p>
                      <p className="font-medium">{cruise.departurePort}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-lightest p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Price Per Person</h3>
                    {cruise.salePrice ? (
                      <>
                        <p className="text-sm text-muted-foreground line-through">
                          ${cruise.pricePerPerson.toFixed(2)}
                        </p>
                        <p className="text-3xl font-bold text-secondary">
                          ${cruise.salePrice.toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="text-3xl font-bold text-secondary">
                        ${cruise.pricePerPerson.toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant={isSaved ? "default" : "outline"}
                    className={isSaved ? "bg-primary text-white" : "border-primary text-primary"}
                    onClick={toggleSave}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-5 w-5 text-success mr-2" />
                    <p className="text-success font-medium">Fully Refundable up to 30 days before departure</p>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary mr-2" />
                    <p className="text-sm text-muted-foreground">Price based on double occupancy</p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleBooking}
                  disabled={isBooking || !isAuthenticated}
                  className="w-full bg-secondary hover:bg-secondary-dark text-white font-semibold text-lg py-6"
                >
                  {isBooking ? "Processing..." : isAuthenticated ? "Book This Cruise" : "Login to Book"}
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="details">
              <TabsList className="w-full border-b mb-4 grid grid-cols-3 h-auto p-0">
                <TabsTrigger 
                  value="details" 
                  className="py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Cruise Details
                </TabsTrigger>
                <TabsTrigger 
                  value="amenities"
                  className="py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Amenities
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews"
                  className="py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Reviews ({cruise.reviewCount})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Itinerary</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                          <span>1</span>
                        </div>
                        <div>
                          <p className="font-medium">Day 1: Departure from {cruise.departurePort}</p>
                          <p className="text-muted-foreground">
                            Begin your journey aboard the {cruise.shipName}. Enjoy welcome drinks
                            and explore the ship's amenities.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                          <span>2</span>
                        </div>
                        <div>
                          <p className="font-medium">Day 2-{cruise.duration}: Explore {cruise.destination}</p>
                          <p className="text-muted-foreground">
                            Visit stunning locations throughout {cruise.destination} with various 
                            port stops and excursion opportunities.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1">
                          <span>{cruise.duration + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">Day {cruise.duration + 1}: Return to {cruise.departurePort}</p>
                          <p className="text-muted-foreground">
                            Return to {cruise.departurePort} with memories to last a lifetime.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold mb-2">Cabin Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cruise.cabinTypes.map((cabinType: string) => {
                        const cabinDetails: Record<string, { title: string, description: string, priceMultiplier: number }> = {
                          interior: {
                            title: "Interior Cabin",
                            description: "Comfortable interior cabins with all essential amenities for a relaxing cruise experience.",
                            priceMultiplier: 1.0
                          },
                          oceanview: {
                            title: "Ocean View Cabin",
                            description: "Enjoy natural light and ocean views through a window or porthole.",
                            priceMultiplier: 1.3
                          },
                          balcony: {
                            title: "Balcony Cabin",
                            description: "Private balcony where you can enjoy the sea breeze and ocean views.",
                            priceMultiplier: 1.6
                          },
                          suite: {
                            title: "Suite",
                            description: "Spacious accommodations with separate living areas and premium amenities.",
                            priceMultiplier: 2.0
                          }
                        };
                        
                        const details = cabinDetails[cabinType] || { 
                          title: cabinType.charAt(0).toUpperCase() + cabinType.slice(1), 
                          description: "Standard cabin with essential amenities.",
                          priceMultiplier: 1.0
                        };
                        
                        const price = cruise.salePrice || cruise.pricePerPerson;
                        const cabinPrice = price * details.priceMultiplier;
                        
                        return (
                          <div key={cabinType} className="bg-neutral-lightest p-4 rounded-md">
                            <h4 className="font-bold">{details.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{details.description}</p>
                            <p className="text-lg font-semibold text-secondary">From ${cabinPrice.toFixed(2)} per person</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="amenities" className="mt-4">
                <AmenitiesList amenities={cruise.amenities} />
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-4">
                {isAuthenticated && !hasUserReviewed && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4">Write a Review</h3>
                    <ReviewForm onSubmit={handleSubmitReview} isSubmitting={addReviewMutation.isPending} />
                  </div>
                )}
                
                <h3 className="text-lg font-bold mb-4">Customer Reviews</h3>
                
                {isReviewsLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="mb-4">
                      <Skeleton className="h-28 w-full" />
                    </div>
                  ))
                ) : reviews?.length > 0 ? (
                  // Show reviews
                  <div>
                    {reviews.map((review: any) => (
                      <ReviewCard
                        key={review.id}
                        rating={review.rating}
                        comment={review.comment}
                        userName={review.userId === user?.id ? `${user.firstName || user.username} (You)` : `User ${review.userId}`}
                        createdAt={review.createdAt}
                      />
                    ))}
                  </div>
                ) : (
                  // No reviews
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No reviews yet</p>
                    {isAuthenticated && !hasUserReviewed ? (
                      <p>Be the first to review this cruise!</p>
                    ) : (
                      <p>Check back later for reviews from other travelers.</p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
