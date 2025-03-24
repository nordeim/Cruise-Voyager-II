import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface CabinSelectorProps {
  cabinTypes: string[];
  basePrice: number;
  onSelect: (cabinType: string, price: number) => void;
  selectedCabinType: string;
}

export default function CabinSelector({ 
  cabinTypes, 
  basePrice,
  onSelect,
  selectedCabinType
}: CabinSelectorProps) {
  // Map cabin types to display information
  const cabinDetails: Record<string, { title: string, description: string, priceMultiplier: number, features: string[] }> = {
    interior: {
      title: "Interior Cabin",
      description: "Comfortable interior cabins with all essential amenities.",
      priceMultiplier: 1.0,
      features: ["Comfortable bedding", "Private bathroom", "Flat-screen TV", "Climate control"]
    },
    oceanview: {
      title: "Ocean View Cabin",
      description: "Enjoy natural light and ocean views through a window or porthole.",
      priceMultiplier: 1.3,
      features: ["Ocean view window", "Comfortable bedding", "Private bathroom", "Flat-screen TV", "Climate control"]
    },
    balcony: {
      title: "Balcony Cabin",
      description: "Private balcony where you can enjoy the sea breeze and ocean views.",
      priceMultiplier: 1.6,
      features: ["Private balcony", "Floor-to-ceiling glass doors", "Outdoor furniture", "Enhanced interior space", "Premium bedding", "Private bathroom", "Flat-screen TV"]
    },
    suite: {
      title: "Suite",
      description: "Spacious accommodations with separate living areas and premium amenities.",
      priceMultiplier: 2.0,
      features: ["Separate living area", "Luxurious balcony", "Premium bedding", "Enhanced bathroom", "Priority boarding", "Concierge service", "Mini-bar", "Premium toiletries"]
    }
  };

  // Set first cabin type as default if none selected
  useEffect(() => {
    if (cabinTypes.length > 0 && !selectedCabinType) {
      const defaultCabinType = cabinTypes[0];
      const details = cabinDetails[defaultCabinType] || { priceMultiplier: 1.0 };
      onSelect(defaultCabinType, basePrice * details.priceMultiplier);
    }
  }, [cabinTypes, selectedCabinType, basePrice, onSelect]);

  // Handle selection
  const handleSelectionChange = (value: string) => {
    const details = cabinDetails[value] || { priceMultiplier: 1.0 };
    onSelect(value, basePrice * details.priceMultiplier);
  };

  return (
    <RadioGroup 
      defaultValue={selectedCabinType || cabinTypes[0]} 
      value={selectedCabinType}
      onValueChange={handleSelectionChange}
      className="space-y-4"
    >
      {cabinTypes.map((cabinType) => {
        const details = cabinDetails[cabinType] || {
          title: cabinType.charAt(0).toUpperCase() + cabinType.slice(1),
          description: "Standard cabin with essential amenities.",
          priceMultiplier: 1.0,
          features: ["Standard amenities"]
        };
        
        const cabinPrice = basePrice * details.priceMultiplier;
        const isSelected = selectedCabinType === cabinType;
        
        return (
          <div key={cabinType} className="relative">
            <RadioGroupItem 
              value={cabinType} 
              id={cabinType} 
              className="peer sr-only"
            />
            <Label
              htmlFor={cabinType}
              className="block cursor-pointer"
            >
              <Card className={`border-2 transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-300'
              }`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">{details.title}</h3>
                        {isSelected && (
                          <div className="flex items-center text-primary text-sm font-semibold">
                            <Check className="h-4 w-4 mr-1" />
                            Selected
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">{details.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {details.features.slice(0, 6).map((feature, index) => (
                          <div key={index} className="flex items-center">
                            <Check className="h-4 w-4 text-primary mr-2" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:text-right">
                      <div className="text-2xl font-bold text-secondary">${cabinPrice.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">per person</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
