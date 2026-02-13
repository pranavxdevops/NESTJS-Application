export type ZoneType =
  | 'Specialized Economic Zone'
  | 'Diversified Zone'
  | 'Free Trade Zone'
  | 'Export Processing Zone'
  | 'Economic Revitalization Project'
  | 'Charter City'
  | 'Foreign Trade Zone'
  | 'Other Zone';

export type Region =
  | 'Africa'
  | 'Caribbean'
  | 'Central America'
  | 'Central Asia'
  | 'East Asia'
  | 'Europe'
  | 'Middle East'
  | 'North America'
  | 'Oceania'
  | 'South America'
  | 'South Asia'
  | 'Southeast Asia';

export type ZoneSpecialization =
  | 'Technology'
  | 'Manufacturing'
  | 'Logistics'
  | 'Finance'
  | 'Tourism'
  | 'Agriculture'
  | 'N/A';

export type ManagementType =
  | 'Public'
  | 'Private'
  | 'Public-Private Partnership'
  | 'N/A';

export type ActivityStatus = 'Active' | 'Inactive' | 'Under Development';

export interface Zone {
  id: string;
  name: string;
  region: Region;
  country: string;
  zoneType: ZoneType;
  zoneSpecialization: ZoneSpecialization;
  managementType: ManagementType;
  managementCompany: string;
  activityStatus: ActivityStatus;
  website: string;
  legalFramework: string;
  latitude: number;
  longitude: number;
  count: number; // Number of zones in this location
}

export const zoneTypeColors: Record<ZoneType, string> = {
  'Specialized Economic Zone': '#F95052',
  'Diversified Zone': '#E6497F',
  'Free Trade Zone': '#BF4BDC',
  'Export Processing Zone': '#7A4FF3',
  'Economic Revitalization Project': '#238BE6',
  'Charter City': '#15ABC0',
  'Foreign Trade Zone': '#82C922',
  'Other Zone': '#FBB107',
};

export const dummyZones: Zone[] = [
  {
    id: '1',
    name: 'Lagos Free Zone',
    region: 'Africa',
    country: 'Nigeria',
    zoneType: 'Free Trade Zone',
    zoneSpecialization: 'Manufacturing',
    managementType: 'Private',
    managementCompany: 'Lagos Free Zone Company',
    activityStatus: 'Active',
    website: 'https://lagosfreezoneplc.com',
    legalFramework: 'Nigerian Export Processing Zones Act',
    latitude: 6.5244,
    longitude: 3.3792,
    count: 21,
  },
  {
    id: '2',
    name: 'Addis Ababa Industrial Parks',
    region: 'Africa',
    country: 'Ethiopia',
    zoneType: 'Specialized Economic Zone',
    zoneSpecialization: 'Manufacturing',
    managementType: 'Public',
    managementCompany: 'Industrial Parks Development Corporation',
    activityStatus: 'Active',
    website: 'https://ipdc.gov.et',
    legalFramework: 'Ethiopian Investment Proclamation',
    latitude: 9.03,
    longitude: 38.74,
    count: 13,
  },
  {
    id: '3',
    name: 'Nairobi Special Economic Zone',
    region: 'Africa',
    country: 'Kenya',
    zoneType: 'Export Processing Zone',
    zoneSpecialization: 'Technology',
    managementType: 'Public-Private Partnership',
    managementCompany: 'Kenya Investment Authority',
    activityStatus: 'Active',
    website: 'https://www.investmentkenya.com',
    legalFramework: 'Kenyan SEZ Act 2015',
    latitude: -1.2921,
    longitude: 36.8219,
    count: 8,
  },
  {
    id: '4',
    name: 'Jebel Ali Free Zone',
    region: 'Middle East',
    country: 'United Arab Emirates',
    zoneType: 'Free Trade Zone',
    zoneSpecialization: 'Logistics',
    managementType: 'Public',
    managementCompany: 'DP World',
    activityStatus: 'Active',
    website: 'https://www.jafza.ae',
    legalFramework: 'UAE Free Zone Regulations',
    latitude: 25.0127,
    longitude: 55.1127,
    count: 10,
  },
  {
    id: '5',
    name: 'Singapore Free Trade Zone',
    region: 'Southeast Asia',
    country: 'Singapore',
    zoneType: 'Free Trade Zone',
    zoneSpecialization: 'Logistics',
    managementType: 'Public',
    managementCompany: 'Singapore Customs',
    activityStatus: 'Active',
    website: 'https://www.customs.gov.sg',
    legalFramework: 'Singapore Free Trade Zones Act',
    latitude: 1.3521,
    longitude: 103.8198,
    count: 21,
  },
  {
    id: '6',
    name: 'Shanghai Free Trade Zone',
    region: 'East Asia',
    country: 'China',
    zoneType: 'Free Trade Zone',
    zoneSpecialization: 'Finance',
    managementType: 'Public',
    managementCompany: 'Shanghai Municipal Government',
    activityStatus: 'Active',
    website: 'https://www.china-shftz.gov.cn',
    legalFramework: 'Chinese Free Trade Zone Regulations',
    latitude: 31.2304,
    longitude: 121.4737,
    count: 13,
  },
  {
    id: '7',
    name: 'Miami Free Trade Zone',
    region: 'North America',
    country: 'United States',
    zoneType: 'Foreign Trade Zone',
    zoneSpecialization: 'Logistics',
    managementType: 'Public-Private Partnership',
    managementCompany: 'Miami-Dade County',
    activityStatus: 'Active',
    website: 'https://www.miamidade.gov',
    legalFramework: 'US Foreign Trade Zones Act',
    latitude: 25.7617,
    longitude: -80.1918,
    count: 10,
  },
  {
    id: '8',
    name: 'Panama Colon Free Zone',
    region: 'Central America',
    country: 'Panama',
    zoneType: 'Free Trade Zone',
    zoneSpecialization: 'Logistics',
    managementType: 'Public',
    managementCompany: 'Zona Libre de Colon',
    activityStatus: 'Active',
    website: 'https://www.zonalibredecolon.com.pa',
    legalFramework: 'Panamanian Free Trade Zone Law',
    latitude: 9.3547,
    longitude: -79.9002,
    count: 8,
  },
  {
    id: '9',
    name: 'Manaus Free Trade Zone',
    region: 'South America',
    country: 'Brazil',
    zoneType: 'Free Trade Zone',
    zoneSpecialization: 'Manufacturing',
    managementType: 'Public',
    managementCompany: 'SUFRAMA',
    activityStatus: 'Active',
    website: 'https://www.gov.br/suframa',
    legalFramework: 'Brazilian Manaus Free Trade Zone Law',
    latitude: -3.119,
    longitude: -60.0217,
    count: 10,
  },
  {
    id: '10',
    name: 'Grand Bahama International Airport',
    region: 'Caribbean',
    country: 'The Bahamas',
    zoneType: 'Free Trade Zone',
    zoneSpecialization: 'N/A',
    managementType: 'Private',
    managementCompany: 'Grand Bahama Airport Company',
    activityStatus: 'Active',
    website: 'https://www.grand-bahama-airport.com',
    legalFramework: 'Bahamas Free Trade Zone Act',
    latitude: 26.5586,
    longitude: -78.6956,
    count: 21,
  },
  {
    id: '11',
    name: 'Mumbai Special Economic Zone',
    region: 'South Asia',
    country: 'India',
    zoneType: 'Specialized Economic Zone',
    zoneSpecialization: 'Technology',
    managementType: 'Public-Private Partnership',
    managementCompany: 'Maharashtra Industrial Development Corporation',
    activityStatus: 'Active',
    website: 'https://www.midcindia.org',
    legalFramework: 'Indian SEZ Act 2005',
    latitude: 19.076,
    longitude: 72.8777,
    count: 13,
  },
  {
    id: '12',
    name: 'Sydney Technology Park',
    region: 'Oceania',
    country: 'Australia',
    zoneType: 'Export Processing Zone',
    zoneSpecialization: 'Technology',
    managementType: 'Public',
    managementCompany: 'NSW Government',
    activityStatus: 'Active',
    website: 'https://www.sydneytechnologypark.com.au',
    legalFramework: 'Australian Investment Regulations',
    latitude: -33.8688,
    longitude: 151.2093,
    count: 8,
  },
];

export const regions: Region[] = [
  'Africa',
  'Caribbean',
  'Central America',
  'Central Asia',
  'East Asia',
  'Europe',
  'Middle East',
  'North America',
  'Oceania',
  'South America',
  'South Asia',
  'Southeast Asia',
];

export const zoneTypes: ZoneType[] = [
  'Specialized Economic Zone',
  'Diversified Zone',
  'Free Trade Zone',
  'Export Processing Zone',
  'Economic Revitalization Project',
  'Charter City',
  'Foreign Trade Zone',
  'Other Zone',
];

export const zoneSpecializations: ZoneSpecialization[] = [
  'Technology',
  'Manufacturing',
  'Logistics',
  'Finance',
  'Tourism',
  'Agriculture',
  'N/A',
];

export const managementTypes: ManagementType[] = [
  'Public',
  'Private',
  'Public-Private Partnership',
  'N/A',
];

export const activityStatuses: ActivityStatus[] = [
  'Active',
  'Inactive',
  'Under Development',
];
