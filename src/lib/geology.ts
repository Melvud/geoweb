export type GeologyInfo = {
  lat: number;
  lng: number;
  name: string;
  lithology: string;
  description: string;
  ageName: string;
  ageYoungMa: number | null;
  ageOldMa: number | null;
  color: string;
  source: string;
  sourceId: number | null;
};

export type GeologyResponse = {
  geology: GeologyInfo | null;
};
