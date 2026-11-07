export interface PopularRoute {
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  minFare: number;
}

// Popular Routes derived strictly from existing mock data in frontend/lib/railway/data.ts
export const POPULAR_ROUTES: PopularRoute[] = [
  { fromCode: "NDLS", fromName: "New Delhi", toCode: "MMCT", toName: "Mumbai Central", minFare: 635 },
  { fromCode: "NDLS", fromName: "New Delhi", toCode: "HWH", toName: "Howrah", minFare: 675 },
  { fromCode: "NDLS", fromName: "New Delhi", toCode: "BSB", toName: "Varanasi", minFare: 1585 },
  { fromCode: "SBC", fromName: "Bengaluru", toCode: "MAS", toName: "Chennai", minFare: 986 },
  { fromCode: "CSMT", fromName: "Mumbai CSMT", toCode: "MAO", toName: "Madgaon Goa", minFare: 1569 },
];
