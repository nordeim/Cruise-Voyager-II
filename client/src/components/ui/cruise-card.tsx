import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import StarRating from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState } from "react";

interface CruiseCardProps {
  id: number;
  title: string;
  cruiseLine: string;
  departurePort: string;
  duration: number;
  shipName: string;
  description: string;
  imageUrl: string;
  pricePerPerson: number;
  salePrice?: number | null;
  rating: number;
  reviewCount: number;
  isBestSeller?: boolean;
  isSpecialOffer?: boolean;
}

export default function CruiseCard({
  id,
  title,
  cruiseLine,
  departurePort,
  duration,
  shipName,
  description,
  imageUrl,
  pricePerPerson,
  salePrice,
  rating,
  reviewCount,
  isBestSeller,
  isSpecialOffer
}: CruiseCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSaved(!isSaved);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow mb-6">
      <div className="md:flex">
        <div className="md:w-1/3">
          <div className="relative h-64 md:h-full">
            <img 
              src={imageUrl} 
              alt={`${title} cruise ship`} 
              className="w-full h-full object-cover"
            />
            {isBestSeller && (
              <div className="absolute top-4 left-4 bg-secondary text-white text-sm font-semibold py-1 px-3 rounded-full">
                Best Seller
              </div>
            )}
            {isSpecialOffer && (
              <div className="absolute top-4 left-4 bg-info text-white text-sm font-semibold py-1 px-3 rounded-full">
                Special Offer
              </div>
            )}
          </div>
        </div>
        <div className="md:w-2/3 p-6">
          <div className="flex flex-wrap justify-between">
            <div className="mb-4 pr-6 flex-1">
              <h3 className="text-xl font-bold text-neutral-darkest font-heading">{title}</h3>
              <p className="text-sm text-primary font-medium mt-1">{cruiseLine}</p>
              <div className="flex items-center mt-2">
                <StarRating rating={rating} />
                <span className="ml-2 text-sm text-muted-foreground">{typeof rating === 'number' ? rating.toFixed(1) : rating} ({reviewCount} reviews)</span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center bg-neutral-lightest text-muted-foreground text-xs px-2 py-1 rounded mr-2 mb-2">
                  <i className="fas fa-map-marker-alt mr-1"></i> {departurePort}
                </span>
                <span className="inline-flex items-center bg-neutral-lightest text-muted-foreground text-xs px-2 py-1 rounded mr-2 mb-2">
                  <i className="fas fa-calendar mr-1"></i> {duration} Nights
                </span>
                <span className="inline-flex items-center bg-neutral-lightest text-muted-foreground text-xs px-2 py-1 rounded mr-2 mb-2">
                  <i className="fas fa-ship mr-1"></i> {shipName}
                </span>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                <p>{description.length > 150 ? `${description.substring(0, 150)}...` : description}</p>
              </div>
            </div>
            <div className="md:text-right">
              <div className="mb-2">
                {salePrice && (
                  <span className="text-xs text-muted-foreground line-through">${pricePerPerson}</span>
                )}
                <div className="text-xl font-bold text-secondary">
                  ${salePrice ? salePrice : pricePerPerson}
                </div>
                <div className="text-xs text-muted-foreground">per person</div>
              </div>
              <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
                <Button 
                  asChild 
                  className="w-full md:w-auto bg-primary hover:bg-primary-dark font-semibold"
                >
                  <Link href={`/cruises/${id}`}>View Details</Link>
                </Button>
                <Button 
                  asChild 
                  className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 text-base shadow-md"
                >
                  <Link href={`/cruises/${id}`}>Book Now</Link>
                </Button>
              </div>
              <div className="mt-2">
                <Button 
                  variant={isSaved ? "default" : "outline"} 
                  className={`w-full md:w-auto ${
                    isSaved 
                      ? "bg-primary text-white" 
                      : "bg-white text-primary border border-primary hover:bg-primary-light hover:text-white"
                  }`} 
                  onClick={toggleSave}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
