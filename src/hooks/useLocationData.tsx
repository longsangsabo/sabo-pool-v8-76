import { useQuery } from '@tanstack/react-query';

interface Province {
  id: string;
  name: string;
  code: string;
}

interface District {
  id: string;
  name: string;
  code: string;
  province_id: string;
}

interface Ward {
  id: string;
  name: string;
  code: string;
  district_id: string;
}

export const useLocationData = () => {
  // Mock provinces data since provinces table doesn't exist
  const { data: provinces = [], isLoading: provincesLoading } = useQuery({
    queryKey: ['provinces'],
    queryFn: async () => {
      const mockProvinces: Province[] = [
        { id: '1', name: 'TP. Hồ Chí Minh', code: 'HCM' },
        { id: '2', name: 'Hà Nội', code: 'HN' },
        { id: '3', name: 'Đà Nẵng', code: 'DN' },
      ];
      return mockProvinces;
    },
  });

  // Mock districts fetch function
  const fetchDistricts = async (provinceId: string): Promise<District[]> => {
    const mockDistricts: District[] = [
      { id: '1', name: 'Quận 1', code: 'Q1', province_id: provinceId },
      { id: '2', name: 'Quận 3', code: 'Q3', province_id: provinceId },
      { id: '3', name: 'Quận 7', code: 'Q7', province_id: provinceId },
    ];
    return mockDistricts;
  };

  // Mock wards fetch function
  const fetchWards = async (districtId: string): Promise<Ward[]> => {
    const mockWards: Ward[] = [
      { id: '1', name: 'Phường Bến Nghé', code: 'P1', district_id: districtId },
      {
        id: '2',
        name: 'Phường Bến Thành',
        code: 'P2',
        district_id: districtId,
      },
      { id: '3', name: 'Phường Cầu Kho', code: 'P3', district_id: districtId },
    ];
    return mockWards;
  };

  return {
    provinces,
    provincesLoading,
    fetchDistricts,
    fetchWards,
  };
};
