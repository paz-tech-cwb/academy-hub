import { rowPaginationFeature, tableFeatures } from '@tanstack/react-table';

export const features = tableFeatures({
  rowPaginationFeature,
});

export type UsersTableFeatures = typeof features;
