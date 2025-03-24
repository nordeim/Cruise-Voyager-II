import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SearchFilters from "@/components/layout/search-filters";
import CruiseCard from "@/components/ui/cruise-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Cruises() {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    new URLSearchParams(window.location.search)
  );
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Extract filter values from URL params
  const getFiltersFromParams = () => {
    const filters: Record<string, any> = {};
    
    // Basic filters
    if (searchParams.has('destination')) filters.destination = searchParams.get('destination');
    if (searchParams.has('departureDate')) filters.departureDate = searchParams.get('departureDate');
    if (searchParams.has('duration')) filters.duration = searchParams.get('duration');
    if (searchParams.has('passengers')) filters.passengers = searchParams.get('passengers');
    
    // Advanced filters
    if (searchParams.has('minPrice')) filters.minPrice = searchParams.get('minPrice');
    if (searchParams.has('maxPrice')) filters.maxPrice = searchParams.get('maxPrice');
    if (searchParams.has('departurePort')) filters.departurePort = searchParams.get('departurePort');
    if (searchParams.has('rating')) filters.rating = searchParams.get('rating');
    
    // Array filters
    filters.cruiseLine = searchParams.getAll('cruiseLine');
    filters.amenities = searchParams.getAll('amenities');
    filters.cabinTypes = searchParams.getAll('cabinTypes');
    
    return filters;
  };

  // Fetch cruises with filters
  const {
    data: cruisesData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/cruises', searchParams.toString()],
  });

  // Update URL when filters change
  const updateUrlParams = (filters: any) => {
    const newParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          (value as string[]).forEach(v => newParams.append(key, v));
        } else if (!Array.isArray(value) || value.length > 0) {
          newParams.append(key, value as string);
        }
      }
    });
    
    // Update URL without navigation
    window.history.replaceState({}, '', `${location}?${newParams.toString()}`);
    setSearchParams(newParams);
  };

  // Handle search form submission
  const handleSearch = (filters: any) => {
    setCurrentPage(1); // Reset to first page on new search
    updateUrlParams(filters);
    refetch();
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  // Sort cruises
  const sortedCruises = cruisesData ? [...cruisesData].sort((a, b) => {
    const aPrice = a.salePrice || a.pricePerPerson;
    const bPrice = b.salePrice || b.pricePerPerson;
    
    switch (sortBy) {
      case "price-asc":
        return aPrice - bPrice;
      case "price-desc":
        return bPrice - aPrice;
      case "duration-asc":
        return a.duration - b.duration;
      case "duration-desc":
        return b.duration - a.duration;
      case "rating-desc":
        return b.rating - a.rating;
      default:
        return 0;
    }
  }) : [];

  // Pagination
  const totalPages = sortedCruises ? Math.ceil(sortedCruises.length / itemsPerPage) : 0;
  const paginatedCruises = sortedCruises?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Initialize with URL params on first load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setSearchParams(urlParams);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-lightest">
      {/* Search Section */}
      <section className="bg-primary text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold font-heading mb-6">Find Your Perfect Cruise</h1>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <SearchFilters 
              onSearch={handleSearch} 
              initialValues={getFiltersFromParams()}
            />
          </div>
        </div>
      </section>
      
      {/* Results Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-darkest font-heading">
              {isLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                `${cruisesData?.length || 0} Cruises Found`
              )}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select defaultValue={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="duration-asc">Duration: Shortest</SelectItem>
                  <SelectItem value="duration-desc">Duration: Longest</SelectItem>
                  <SelectItem value="rating-desc">Rating: Highest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cruise Listings */}
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
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
            ))
          ) : paginatedCruises?.length > 0 ? (
            // Cruise cards
            paginatedCruises.map((cruise: any) => (
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
                isSpecialOffer={cruise.isSpecialOffer}
              />
            ))
          ) : (
            // No results
            <div className="bg-white rounded-lg shadow-md p-10 text-center">
              <h3 className="text-xl font-bold mb-2">No Cruises Found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any cruises matching your search criteria.
              </p>
              <Button 
                onClick={() => {
                  updateUrlParams({});
                  refetch();
                }}
                className="bg-primary hover:bg-primary-dark"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="inline-flex rounded-md shadow">
                <Button
                  variant="outline"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-4 py-2 rounded-l-md border"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;
                  // Only show current page, first, last, and 1 page before and after current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    page === currentPage ||
                    page === currentPage - 1 ||
                    page === currentPage + 1
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => goToPage(page)}
                        className={`inline-flex items-center px-4 py-2 border ${
                          currentPage === page
                            ? "bg-primary text-white"
                            : "bg-white text-muted-foreground"
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  } else if (
                    (page === 2 && currentPage > 3) ||
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    // Display ellipsis
                    return (
                      <Button
                        key={page}
                        variant="outline"
                        disabled
                        className="inline-flex items-center px-4 py-2 border bg-white"
                      >
                        ...
                      </Button>
                    );
                  }
                  return null;
                })}
                
                <Button
                  variant="outline"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-4 py-2 rounded-r-md border"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
