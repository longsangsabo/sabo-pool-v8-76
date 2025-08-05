import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleMapsPlacesAutocompleteProps {
  onPlaceSelect: (place: GooglePlace) => void;
  disabled?: boolean;
}

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GooglePlacesResponse {
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>;
}

const GoogleMapsPlacesAutocomplete = ({
  onPlaceSelect,
  disabled = false,
}: GoogleMapsPlacesAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<
    GooglePlacesResponse['predictions']
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim() || !GOOGLE_PLACES_API_KEY) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const keyword = `${searchQuery} billiard club`;
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(keyword)}&components=country:vn&types=establishment&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();

      if (data.predictions) {
        setPredictions(data.predictions);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      toast.error('Lỗi kết nối mạng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      toast.error('API key Google Maps không được cấu hình');
      return;
    }

    setIsLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.result) {
        const place: GooglePlace = {
          place_id: data.result.place_id,
          name: data.result.name,
          formatted_address: data.result.formatted_address,
          geometry: data.result.geometry,
        };

        setSelectedPlace(place);
        onPlaceSelect(place);
        setShowDropdown(false);
        setQuery(data.result.name);
        toast.success('Đã chọn CLB từ Google Maps');
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      toast.error('Lỗi khi lấy thông tin địa điểm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedPlace(null);

    if (value.trim()) {
      const timeoutId = setTimeout(() => searchPlaces(value), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const handlePredictionClick = (
    prediction: GooglePlacesResponse['predictions'][0]
  ) => {
    getPlaceDetails(prediction.place_id);
  };

  if (!GOOGLE_PLACES_API_KEY) {
    return (
      <div className='space-y-2'>
        <Label>Google Maps API Key</Label>
        <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
          <p className='text-sm text-yellow-800'>
            Vui lòng cấu hình VITE_GOOGLE_PLACES_KEY trong file .env để sử dụng
            tính năng tìm kiếm CLB trên Google Maps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2 relative' ref={dropdownRef}>
      <Label htmlFor='google-maps-search'>Tìm CLB trên Google Maps</Label>
      <div className='relative'>
        <Input
          id='google-maps-search'
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          placeholder='Nhập tên CLB để tìm kiếm...'
          disabled={disabled}
          className='pr-10'
        />
        <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
          {isLoading ? (
            <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
          ) : (
            <Search className='w-4 h-4 text-gray-400' />
          )}
        </div>
      </div>

      {/* Dropdown with predictions */}
      {showDropdown && predictions.length > 0 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto'>
          {predictions.map(prediction => (
            <button
              key={prediction.place_id}
              onClick={() => handlePredictionClick(prediction)}
              className='w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3'
            >
              <MapPin className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
              <div className='flex-1 min-w-0'>
                <div className='font-medium text-gray-900 truncate'>
                  {prediction.structured_formatting.main_text}
                </div>
                <div className='text-sm text-gray-500 truncate'>
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected place info */}
      {selectedPlace && (
        <div className='mt-3 p-3 bg-green-50 border border-green-200 rounded-md'>
          <div className='flex items-start space-x-2'>
            <MapPin className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
            <div className='flex-1'>
              <div className='font-medium text-green-900'>
                {selectedPlace.name}
              </div>
              <div className='text-sm text-green-700'>
                {selectedPlace.formatted_address}
              </div>
              <div className='text-xs text-green-600 mt-1'>
                Tọa độ: {selectedPlace.geometry.location.lat.toFixed(6)},{' '}
                {selectedPlace.geometry.location.lng.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsPlacesAutocomplete;
