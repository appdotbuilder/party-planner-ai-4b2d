
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Star, Calendar } from 'lucide-react';
import { useState } from 'react';

interface RichContentProps {
  metadata: string;
}

interface Activity {
  name: string;
  description: string;
  cost?: number;
  image_url?: string;
}

interface ItineraryActivity {
  time: string;
  activity: string;
  location: string;
  cost?: number;
}

interface Itinerary {
  day: number;
  activities: ItineraryActivity[];
}

interface RichMedia {
  images?: string[];
  activities?: Activity[];
  itinerary?: Itinerary;
}

interface ParsedMetadata {
  quick_replies?: string[];
  rich_media?: RichMedia;
}

export function RichContent({ metadata }: RichContentProps) {
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);

  let content: ParsedMetadata;
  try {
    content = JSON.parse(metadata);
  } catch {
    return null;
  }

  if (!content.rich_media) return null;

  const { rich_media } = content;

  return (
    <div className="space-y-4 ml-11 animate-fadeIn">
      {/* Images Gallery */}
      {rich_media.images && rich_media.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 max-w-md">
          {rich_media.images.map((image: string, index: number) => (
            <Card key={index} className="overflow-hidden border-0 shadow-sm group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform">
                  {index % 4 === 0 ? '🏖️' : index % 4 === 1 ? '🍹' : index % 4 === 2 ? '🎊' : '🌃'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Activities List */}
      {rich_media.activities && rich_media.activities.length > 0 && (
        <div className="space-y-3 max-w-md">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center">
            <Star className="w-4 h-4 mr-2 text-blue-900" />
            Recommended Activities
          </h3>
          {rich_media.activities.map((activity: Activity, index: number) => (
            <Card 
              key={index} 
              className={`p-4 border-0 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                selectedActivity === index ? 'ring-2 ring-blue-900 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedActivity(selectedActivity === index ? null : index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    {activity.name}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-3">
                    {activity.cost && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        <DollarSign className="w-3 h-3 mr-1" />
                        ${activity.cost}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Popular Choice
                    </Badge>
                  </div>
                </div>
                <div className="text-2xl ml-3 opacity-80">
                  {index % 3 === 0 ? '🎭' : index % 3 === 1 ? '🍸' : '🎪'}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Itinerary */}
      {rich_media.itinerary && (
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50 max-w-md">
          <div className="flex items-center mb-3">
            <Calendar className="w-4 h-4 mr-2 text-blue-900" />
            <h3 className="font-semibold text-gray-900 text-sm">
              Day {rich_media.itinerary.day} Itinerary
            </h3>
          </div>
          
          <div className="space-y-3">
            {rich_media.itinerary.activities.map((item: ItineraryActivity, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <Badge variant="outline" className="text-xs font-mono bg-white">
                  {item.time}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {item.activity}
                  </p>
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{item.location}</span>
                    {item.cost && (
                      <>
                        <Separator orientation="vertical" className="mx-2 h-3" />
                        <DollarSign className="w-3 h-3 mr-1" />
                        <span>${item.cost}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4 text-blue-900 border-blue-200 hover:bg-blue-900 hover:text-white"
          >
            Add to My Itinerary
          </Button>
        </Card>
      )}
    </div>
  );
}
