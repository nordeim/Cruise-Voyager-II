import { Card, CardContent } from "@/components/ui/card";
import StarRating from "@/components/ui/star-rating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
}

export default function ReviewCard({
  rating,
  comment,
  userName,
  createdAt
}: ReviewCardProps) {
  // Format the date
  const formattedDate = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  // Get initials for avatar
  const initials = userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-4">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
              <h4 className="font-semibold">{userName}</h4>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            <StarRating rating={rating} />
            <p className="mt-2 text-sm">{comment}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
