import { 
  Wifi, 
  Utensils, 
  Dumbbell, 
  Gamepad2, 
  Users, 
  Glasses, 
  Music, 
  Dice5, 
  Coffee, 
  Baby 
} from "lucide-react";
import { FaSwimmingPool, FaSpa } from "react-icons/fa";

interface AmenitiesListProps {
  amenities: string[];
}

export default function AmenitiesList({ amenities }: AmenitiesListProps) {
  // Define all possible amenities with icons
  const amenityDetails: Record<string, { label: string, icon: React.ReactNode, description: string }> = {
    pools: {
      label: "Swimming Pools",
      icon: <FaSwimmingPool />,
      description: "Multiple swimming pools including adult-only and family-friendly options"
    },
    casino: {
      label: "Casino",
      icon: <Dice5 />,
      description: "Full-service casino featuring slots, table games, and poker"
    },
    spa: {
      label: "Spa & Wellness",
      icon: <FaSpa />,
      description: "Luxurious spa offering massages, facials, and beauty treatments"
    },
    kidsClub: {
      label: "Kids Club",
      icon: <Baby />,
      description: "Supervised activities and play areas for children of all ages"
    },
    wifi: {
      label: "Wi-Fi",
      icon: <Wifi />,
      description: "High-speed internet access throughout the ship"
    },
    restaurants: {
      label: "Specialty Restaurants",
      icon: <Utensils />,
      description: "Multiple dining options including specialty and themed restaurants"
    },
    gym: {
      label: "Fitness Center",
      icon: <Dumbbell />,
      description: "State-of-the-art gym with equipment and fitness classes"
    },
    entertainment: {
      label: "Live Entertainment",
      icon: <Music />,
      description: "Broadway-style shows, live music, and comedy performances"
    },
    bars: {
      label: "Bars & Lounges",
      icon: <Glasses />,
      description: "Various themed bars and lounges with specialty cocktails"
    },
    arcades: {
      label: "Arcade & Games",
      icon: <Gamepad2 />,
      description: "Video games, simulators, and interactive entertainment"
    },
    coffeeshop: {
      label: "Coffee Shop",
      icon: <Coffee />,
      description: "Premium coffee shop serving specialty coffees and pastries"
    },
    clubs: {
      label: "Nightclubs",
      icon: <Users />,
      description: "Nightclubs and dancing venues for evening entertainment"
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {amenities.map((amenity) => {
          const details = amenityDetails[amenity] || {
            label: amenity.charAt(0).toUpperCase() + amenity.slice(1),
            icon: <Wifi />,
            description: "Available on this cruise"
          };
          
          return (
            <div key={amenity} className="bg-neutral-lightest p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 text-primary mr-3">
                  {details.icon}
                </div>
                <h3 className="font-bold">{details.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{details.description}</p>
            </div>
          );
        })}
      </div>
      
      {amenities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No specific amenities listed for this cruise.</p>
        </div>
      )}
    </div>
  );
}
