import React, { useState, useEffect } from 'react';

interface Province {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
}

interface District {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  province_code: number;
}

interface Ward {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  district_code: number;
}

interface Selection {
  province?: { code: number; name: string };
  district?: { code: number; name: string };
  ward?: { code: number; name: string };
}

interface Props {
  onChange: (selection: Selection) => void;
  className?: string;
}

const ProvinceDistrictWardSelector: React.FC<Props> = ({
  onChange,
  className = '',
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Notify parent of selection changes
  useEffect(() => {
    onChange({
      province: selectedProvince
        ? { code: selectedProvince.code, name: selectedProvince.name }
        : undefined,
      district: selectedDistrict
        ? { code: selectedDistrict.code, name: selectedDistrict.name }
        : undefined,
      ward: selectedWard
        ? { code: selectedWard.code, name: selectedWard.name }
        : undefined,
    });
  }, [selectedProvince, selectedDistrict, selectedWard, onChange]);

  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      setError(null);

      const response = await fetch('https://provinces.open-api.vn/api/p/');
      if (!response.ok) {
        throw new Error('Không thể tải danh sách tỉnh/thành');
      }

      const data = await response.json();
      setProvinces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      console.error('Error fetching provinces:', err);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchDistricts = async (provinceCode: number) => {
    try {
      setLoadingDistricts(true);
      setError(null);

      const response = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
      );
      if (!response.ok) {
        throw new Error('Không thể tải danh sách huyện/quận');
      }

      const data = await response.json();
      setDistricts(data.districts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      console.error('Error fetching districts:', err);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchWards = async (districtCode: number) => {
    try {
      setLoadingWards(true);
      setError(null);

      const response = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
      );
      if (!response.ok) {
        throw new Error('Không thể tải danh sách xã/phường');
      }

      const data = await response.json();
      setWards(data.wards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      console.error('Error fetching wards:', err);
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleProvinceChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const provinceCode = parseInt(event.target.value);

    if (provinceCode === 0) {
      // Reset all selections
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setDistricts([]);
      setWards([]);
      return;
    }

    const province = provinces.find(p => p.code === provinceCode);
    if (province) {
      setSelectedProvince(province);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setWards([]);
      fetchDistricts(provinceCode);
    }
  };

  const handleDistrictChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const districtCode = parseInt(event.target.value);

    if (districtCode === 0) {
      setSelectedDistrict(null);
      setSelectedWard(null);
      setWards([]);
      return;
    }

    const district = districts.find(d => d.code === districtCode);
    if (district) {
      setSelectedDistrict(district);
      setSelectedWard(null);
      fetchWards(districtCode);
    }
  };

  const handleWardChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const wardCode = parseInt(event.target.value);

    if (wardCode === 0) {
      setSelectedWard(null);
      return;
    }

    const ward = wards.find(w => w.code === wardCode);
    if (ward) {
      setSelectedWard(ward);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {/* Province Select */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Tỉnh/Thành phố *
          </label>
          <select
            className='border border-gray-300 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
            onChange={handleProvinceChange}
            disabled={loadingProvinces}
            value={selectedProvince?.code || 0}
          >
            <option value={0}>
              {loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành'}
            </option>
            {provinces.map(province => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        {/* District Select */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Huyện/Quận
          </label>
          <select
            className='border border-gray-300 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
            onChange={handleDistrictChange}
            disabled={!selectedProvince || loadingDistricts}
            value={selectedDistrict?.code || 0}
          >
            <option value={0}>
              {!selectedProvince
                ? 'Chọn tỉnh/thành trước'
                : loadingDistricts
                  ? 'Đang tải...'
                  : 'Chọn huyện/quận'}
            </option>
            {districts.map(district => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ward Select */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Xã/Phường
          </label>
          <select
            className='border border-gray-300 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
            onChange={handleWardChange}
            disabled={!selectedDistrict || loadingWards}
            value={selectedWard?.code || 0}
          >
            <option value={0}>
              {!selectedDistrict
                ? 'Chọn huyện/quận trước'
                : loadingWards
                  ? 'Đang tải...'
                  : 'Chọn xã/phường'}
            </option>
            {wards.map(ward => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedProvince || selectedDistrict || selectedWard) && (
        <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
          <h4 className='text-sm font-medium text-blue-900 mb-2'>
            Địa chỉ đã chọn:
          </h4>
          <div className='text-sm text-blue-800'>
            {selectedProvince && (
              <div className='flex items-center gap-2'>
                <span className='font-medium'>Tỉnh/Thành:</span>
                <span>{selectedProvince.name}</span>
              </div>
            )}
            {selectedDistrict && (
              <div className='flex items-center gap-2'>
                <span className='font-medium'>Huyện/Quận:</span>
                <span>{selectedDistrict.name}</span>
              </div>
            )}
            {selectedWard && (
              <div className='flex items-center gap-2'>
                <span className='font-medium'>Xã/Phường:</span>
                <span>{selectedWard.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvinceDistrictWardSelector;
