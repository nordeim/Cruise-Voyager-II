import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SearchFilters from "@/components/layout/search-filters";
import CruiseCard from "@/components/ui/cruise-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  // Fetch bestseller cruises
  const { 
    data: bestSellerCruises,
    isLoading: isBestSellersLoading 
  } = useQuery({
    queryKey: ['/api/cruises/featured/bestsellers'],
  });
  
  // Fetch special offers
  const { 
    data: specialOfferCruises,
    isLoading: isSpecialOffersLoading 
  } = useQuery({
    queryKey: ['/api/cruises/featured/special-offers'],
  });
  
  // Handle search form submission
  const handleSearch = (filters: any) => {
    // Convert filters to query string
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          (value as string[]).forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value as string);
        }
      }
    });
    
    // Navigate to cruises page with filters
    window.location.href = `/cruises?${queryParams.toString()}`;
  };
  
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-primary text-white py-12">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: "url('https://images.unsplash.com/photo-1548574505-5e239809ee19?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')"}}></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Find Your Perfect Cruise Vacation</h1>
            <p className="text-lg opacity-90">Explore amazing destinations worldwide with our premium cruise packages</p>
          </div>
          
          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-primary text-xl font-heading font-semibold mb-4">Search Cruises</h2>
            <SearchFilters onSearch={handleSearch} />
          </div>
        </div>
      </section>
      
      {/* Best Sellers Section */}
      <section className="py-12 bg-neutral-lightest">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-darkest font-heading">Best Selling Cruises</h2>
            <Link href="/cruises">
              <Button variant="link" className="text-primary">View All Cruises</Button>
            </Link>
          </div>
          
          {isBestSellersLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <Skeleton className="h-64 md:h-full w-full" />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <Skeleton className="h-8 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {bestSellerCruises?.map((cruise: any) => (
                <CruiseCard
                  key={cruise.id}
                  id={cruise.id}
                  title={cruise.title}
                  cruiseLine={cruise.cruiseLine}
                  departurePort={cruise.departurePort}
                  duration={cruise.duration}
                  shipName={cruise.shipName}
                  description={cruise.description}
                  imageUrl={cruise.imageUrl}
                  pricePerPerson={cruise.pricePerPerson}
                  salePrice={cruise.salePrice}
                  rating={cruise.rating}
                  reviewCount={cruise.reviewCount}
                  isBestSeller={cruise.isBestSeller}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Special Offers Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-darkest font-heading">Special Offers</h2>
            <Link href="/cruises?isSpecialOffer=true">
              <Button variant="link" className="text-primary">View All Offers</Button>
            </Link>
          </div>
          
          {isSpecialOffersLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <Skeleton className="h-64 md:h-full w-full" />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <Skeleton className="h-8 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {specialOfferCruises?.map((cruise: any) => (
                <CruiseCard
                  key={cruise.id}
                  id={cruise.id}
                  title={cruise.title}
                  cruiseLine={cruise.cruiseLine}
                  departurePort={cruise.departurePort}
                  duration={cruise.duration}
                  shipName={cruise.shipName}
                  description={cruise.description}
                  imageUrl={cruise.imageUrl}
                  pricePerPerson={cruise.pricePerPerson}
                  salePrice={cruise.salePrice}
                  rating={cruise.rating}
                  reviewCount={cruise.reviewCount}
                  isSpecialOffer={cruise.isSpecialOffer}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Destinations Section */}
      <section className="py-12 bg-neutral-lightest">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-neutral-darkest font-heading text-center mb-12">Popular Destinations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Caribbean",
                image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                desc: "Crystal clear waters, white sandy beaches, and tropical paradise."
              },
              {
                name: "Mediterranean",
                image: "https://images.unsplash.com/photo-1537861295351-76bb831ece99?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                desc: "Ancient ruins, charming villages, and stunning coastal landscapes."
              },
              {
                name: "Alaska",
                image: "https://images.unsplash.com/photo-1531176175280-64fbcbdceada?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                desc: "Majestic glaciers, abundant wildlife, and breathtaking natural beauty."
              }
            ].map((destination, index) => (
              <div key={index} className="rounded-lg overflow-hidden shadow-md bg-white hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <img
                    src={destination.image}
                    alt={`${destination.name} destination`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold font-heading mb-2">{destination.name}</h3>
                  <p className="text-muted-foreground mb-4">{destination.desc}</p>
                  <Button asChild className="w-full bg-primary hover:bg-primary-dark">
                    <Link href={`/cruises?destination=${destination.name.toLowerCase()}`}>
                      Explore {destination.name} Cruises
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-heading mb-4">Ready to Start Your Cruise Adventure?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Book your dream cruise vacation today and experience the journey of a lifetime with exclusive deals and premium service.
          </p>
          <Button asChild className="bg-secondary hover:bg-secondary-dark text-white font-semibold px-8 py-6 text-lg">
            <Link href="/cruises">
              Browse All Cruises
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
