import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/ui/star-rating";

// Define review form schema
const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(3, "Please enter your review").max(500, "Review is too long"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  onSubmit: (data: ReviewFormValues) => void;
  isSubmitting: boolean;
  initialValues?: Partial<ReviewFormValues>;
}

export default function ReviewForm({ 
  onSubmit, 
  isSubmitting, 
  initialValues = { rating: 0, comment: "" } 
}: ReviewFormProps) {
  const [previewRating, setPreviewRating] = useState(initialValues.rating || 0);
  
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: initialValues as ReviewFormValues,
  });
  
  const handleRatingChange = (rating: number) => {
    setPreviewRating(rating);
    form.setValue("rating", rating);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rating</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  <StarRating 
                    rating={previewRating} 
                    interactive={true} 
                    size="lg" 
                    onRatingChange={handleRatingChange} 
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {previewRating > 0 
                      ? `${previewRating} star${previewRating !== 1 ? 's' : ''}` 
                      : 'Select a rating'}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Review</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Share your experience on this cruise..."
                  className="min-h-32 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {field.value?.length || 0}/500 characters
              </div>
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="bg-primary hover:bg-primary-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </Form>
  );
}
