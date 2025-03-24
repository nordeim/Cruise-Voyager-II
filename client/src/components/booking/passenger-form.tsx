import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PassengerFormProps {
  form: UseFormReturn<any>;
  passengerCount: number;
}

export default function PassengerForm({ 
  form, 
  passengerCount 
}: PassengerFormProps) {
  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['passenger-0']}>
        {Array.from({ length: passengerCount }).map((_, index) => (
          <AccordionItem key={index} value={`passenger-${index}`}>
            <AccordionTrigger className="text-md">
              Passenger {index + 1} {index === 0 ? '(Lead Passenger)' : ''}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <FormField
                  control={form.control}
                  name={`passengers.${index}.firstName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`passengers.${index}.lastName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`passengers.${index}.dateOfBirth`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`passengers.${index}.citizenship`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Citizenship*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter citizenship" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="text-xs text-muted-foreground mt-2">
        * All passenger information must match travel documents exactly.
      </div>
    </div>
  );
}
